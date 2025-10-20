import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { categorizeEmail } from './aiService';
import { indexEmail } from './elasticsearchService';
import { sendSlackNotification, sendWebhook } from './integrationService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailAccount {
  id: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  sync_enabled: boolean;
}

const activeConnections = new Map<string, Imap>();

export async function startEmailSync(account: EmailAccount) {
  if (activeConnections.has(account.id)) {
    console.log(`Connection already exists for account ${account.email}`);
    return;
  }

  const imap = new Imap({
    user: account.imap_username,
    password: account.imap_password,
    host: account.imap_host,
    port: account.imap_port,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    keepalive: {
      interval: 10000,
      idleInterval: 300000,
      forceNoop: true,
    },
  });

  activeConnections.set(account.id, imap);

  imap.once('ready', () => {
    console.log(`IMAP connected for ${account.email}`);
    syncFolder(imap, account, 'INBOX');
  });

  imap.once('error', (err: Error) => {
    console.error(`IMAP error for ${account.email}:`, err);
    activeConnections.delete(account.id);
  });

  imap.once('end', () => {
    console.log(`IMAP connection ended for ${account.email}`);
    activeConnections.delete(account.id);
  });

  imap.connect();
}

async function syncFolder(imap: Imap, account: EmailAccount, folderName: string) {
  imap.openBox(folderName, false, async (err, box) => {
    if (err) {
      console.error(`Error opening ${folderName}:`, err);
      return;
    }

    console.log(`Opened ${folderName} for ${account.email}`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const searchCriteria = [
      ['SINCE', thirtyDaysAgo]
    ];

    imap.search(searchCriteria, (err, results) => {
      if (err) {
        console.error('Search error:', err);
        return;
      }

      if (results.length === 0) {
        console.log('No emails found in the last 30 days');
        startIdleMode(imap, account, folderName);
        return;
      }

      console.log(`Found ${results.length} emails to sync`);

      const fetch = imap.fetch(results, {
        bodies: '',
        struct: true,
        markSeen: false,
      });

      fetch.on('message', (msg, seqno) => {
        processMessage(msg, seqno, account, folderName);
      });

      fetch.once('error', (err) => {
        console.error('Fetch error:', err);
      });

      fetch.once('end', () => {
        console.log('Initial sync completed');
        startIdleMode(imap, account, folderName);

        supabase
          .from('email_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.id)
          .then(() => console.log('Updated last_sync_at'));
      });
    });
  });
}

function startIdleMode(imap: Imap, account: EmailAccount, folderName: string) {
  console.log(`Starting IDLE mode for ${account.email} in ${folderName}`);

  imap.on('mail', (numNew) => {
    console.log(`${numNew} new email(s) arrived in ${folderName}`);

    imap.search(['UNSEEN'], (err, results) => {
      if (err || !results || results.length === 0) return;

      const fetch = imap.fetch(results, {
        bodies: '',
        struct: true,
        markSeen: false,
      });

      fetch.on('message', (msg, seqno) => {
        processMessage(msg, seqno, account, folderName);
      });
    });
  });

  const idleInterval = setInterval(() => {
    if (imap.state === 'authenticated') {
      try {
        imap.idle();
      } catch (err) {
        console.error('IDLE error:', err);
      }
    }
  }, 60000);

  imap.once('end', () => {
    clearInterval(idleInterval);
  });
}

async function processMessage(msg: any, seqno: number, account: EmailAccount, folderName: string) {
  let buffer = '';
  let uid = '';
  let attributes: any = null;

  msg.on('body', (stream: any) => {
    stream.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
    });
  });

  msg.once('attributes', (attrs: any) => {
    attributes = attrs;
    uid = attrs.uid;
  });

  msg.once('end', async () => {
    try {
      const parsed: ParsedMail = await simpleParser(buffer);

      const emailData = {
        account_id: account.id,
        message_id: parsed.messageId || `${account.id}-${uid}-${Date.now()}`,
        uid: String(uid),
        subject: parsed.subject || '(No Subject)',
        from_address: parsed.from?.value[0]?.address || '',
        from_name: parsed.from?.value[0]?.name || '',
        to_addresses: JSON.stringify(parsed.to?.value || []),
        cc_addresses: JSON.stringify(parsed.cc?.value || []),
        folder: folderName,
        body_text: parsed.text || '',
        body_html: parsed.html || '',
        received_at: parsed.date || new Date(),
        is_read: attributes?.flags?.includes('\\Seen') || false,
      };

      const { data: existingEmail } = await supabase
        .from('emails')
        .select('id')
        .eq('account_id', account.id)
        .eq('message_id', emailData.message_id)
        .maybeSingle();

      if (existingEmail) {
        console.log(`Email already exists: ${emailData.subject}`);
        return;
      }

      const { data: savedEmail, error } = await supabase
        .from('emails')
        .insert(emailData)
        .select()
        .single();

      if (error) {
        console.error('Error saving email:', error);
        return;
      }

      console.log(`Saved email: ${emailData.subject}`);

      const category = await categorizeEmail(emailData.subject, emailData.body_text);

      await supabase
        .from('emails')
        .update({
          category: category.category,
          category_confidence: category.confidence,
        })
        .eq('id', savedEmail.id);

      await indexEmail(savedEmail.id, {
        ...emailData,
        category: category.category,
      });

      if (category.category === 'Interested') {
        await sendSlackNotification(emailData);
        await sendWebhook(emailData);
      }

    } catch (err) {
      console.error('Error processing message:', err);
    }
  });
}

export async function stopEmailSync(accountId: string) {
  const imap = activeConnections.get(accountId);
  if (imap) {
    imap.end();
    activeConnections.delete(accountId);
    console.log(`Stopped sync for account ${accountId}`);
  }
}

export async function syncAllAccounts() {
  const { data: accounts, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('sync_enabled', true);

  if (error) {
    console.error('Error fetching accounts:', error);
    return;
  }

  for (const account of accounts || []) {
    await startEmailSync(account);
  }
}

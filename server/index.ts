import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { startEmailSync, stopEmailSync, syncAllAccounts } from './services/imapService';
import { initializeElasticsearch, searchEmails, checkElasticsearchHealth } from './services/elasticsearchService';
import { categorizeEmail } from './services/aiService';
import { storeProductContext, getSuggestedReplyForEmail } from './services/ragService';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/elasticsearch/health', async (req, res) => {
  try {
    const health = await checkElasticsearchHealth();
    res.json({ status: 'ok', elasticsearch: health });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { userId, email, imapHost, imapPort, imapUsername, imapPassword, syncEnabled } = req.body;

    if (!userId || !email || !imapHost || !imapUsername || !imapPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('email_accounts')
      .insert({
        user_id: userId,
        email,
        imap_host: imapHost,
        imap_port: imapPort || 993,
        imap_username: imapUsername,
        imap_password: imapPassword,
        sync_enabled: syncEnabled !== false,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (data.sync_enabled) {
      await startEmailSync(data);
    }

    res.json({ success: true, account: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/accounts', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ accounts: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts/:accountId/sync', async (req, res) => {
  try {
    const { accountId } = req.params;

    const { data: account, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await startEmailSync(account);

    res.json({ success: true, message: 'Sync started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts/:accountId/stop', async (req, res) => {
  try {
    const { accountId } = req.params;

    await stopEmailSync(accountId);

    res.json({ success: true, message: 'Sync stopped' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails', async (req, res) => {
  try {
    const { userId, accountId, folder, category, limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let query = supabase
      .from('emails')
      .select(`
        *,
        email_accounts!inner(user_id, email)
      `)
      .eq('email_accounts.user_id', userId)
      .order('received_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    if (folder) {
      query = query.eq('folder', folder);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ emails: data, total: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('emails')
      .select(`
        *,
        email_accounts!inner(user_id, email)
      `)
      .eq('id', emailId)
      .eq('email_accounts.user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ email: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emails/search', async (req, res) => {
  try {
    const { query, accountId, folder, category, from = 0, size = 50 } = req.body;

    const results = await searchEmails(query, {
      accountId,
      folder,
      category,
      from,
      size,
    });

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emails/:emailId/categorize', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select(`
        *,
        email_accounts!inner(user_id)
      `)
      .eq('id', emailId)
      .eq('email_accounts.user_id', userId)
      .single();

    if (emailError || !email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const result = await categorizeEmail(email.subject, email.body_text);

    const { error: updateError } = await supabase
      .from('emails')
      .update({
        category: result.category,
        category_confidence: result.confidence,
      })
      .eq('id', emailId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_categories')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ categories: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/product-context', async (req, res) => {
  try {
    const { userId, productName, description, outreachAgenda, meetingLink, additionalContext } = req.body;

    if (!userId || !productName || !description || !outreachAgenda) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const data = await storeProductContext(
      userId,
      productName,
      description,
      outreachAgenda,
      meetingLink,
      additionalContext
    );

    res.json({ success: true, context: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/product-context', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('product_context')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ contexts: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emails/:emailId/suggested-reply', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const suggestedReply = await getSuggestedReplyForEmail(emailId, userId);

    res.json({ success: true, suggestedReply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/webhook-logs', async (req, res) => {
  try {
    const { userId, emailId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let query = supabase
      .from('webhook_logs')
      .select(`
        *,
        emails!inner(
          id,
          email_accounts!inner(user_id)
        )
      `)
      .eq('emails.email_accounts.user_id', userId)
      .order('attempted_at', { ascending: false });

    if (emailId) {
      query = query.eq('email_id', emailId);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ logs: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync-all', async (req, res) => {
  try {
    await syncAllAccounts();
    res.json({ success: true, message: 'Started syncing all accounts' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  try {
    console.log('Initializing Elasticsearch...');
    await initializeElasticsearch();

    console.log('Starting email sync for all accounts...');
    await syncAllAccounts();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

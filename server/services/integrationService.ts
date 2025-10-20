import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendSlackNotification(emailData: any) {
  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl || slackWebhookUrl.includes('your_slack')) {
      console.log('Slack webhook URL not configured, skipping notification');
      return;
    }

    const message = {
      text: '🎯 New Interested Email',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 New Interested Email',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*From:*\n${emailData.from_name || emailData.from_address}`,
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${emailData.from_address}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Subject:*\n${emailData.subject}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Preview:*\n${emailData.body_text.substring(0, 200)}...`,
          },
        },
      ],
    };

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('Slack notification sent successfully');
    } else {
      console.error('Failed to send Slack notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

export async function sendWebhook(emailData: any) {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes('your-unique')) {
      console.log('Webhook URL not configured, skipping webhook');
      return;
    }

    const payload = {
      event: 'email.interested',
      timestamp: new Date().toISOString(),
      data: {
        from: emailData.from_address,
        from_name: emailData.from_name,
        subject: emailData.subject,
        body_preview: emailData.body_text.substring(0, 500),
        received_at: emailData.received_at,
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const logData = {
      email_id: emailData.id,
      webhook_url: webhookUrl,
      status: response.ok ? 'success' : 'failed',
      response_code: response.status,
      response_body: await response.text(),
    };

    await supabase.from('webhook_logs').insert(logData);

    console.log(`Webhook sent: ${response.ok ? 'success' : 'failed'}`);
  } catch (error) {
    console.error('Error sending webhook:', error);

    await supabase.from('webhook_logs').insert({
      email_id: emailData.id,
      webhook_url: process.env.WEBHOOK_URL,
      status: 'error',
      response_body: String(error),
    });
  }
}

const API_BASE_URL = 'http://localhost:3001/api';

export interface Email {
  id: string;
  account_id: string;
  message_id: string;
  subject: string;
  from_address: string;
  from_name: string;
  folder: string;
  body_text: string;
  body_html: string;
  received_at: string;
  is_read: boolean;
  category: string;
  category_confidence: number;
  email_accounts: {
    email: string;
  };
}

export interface EmailAccount {
  id: string;
  email: string;
  imap_host: string;
  imap_port: number;
  sync_enabled: boolean;
  last_sync_at: string;
}

export const api = {
  async getAccounts(userId: string): Promise<EmailAccount[]> {
    const response = await fetch(`${API_BASE_URL}/accounts?userId=${userId}`);
    const data = await response.json();
    return data.accounts;
  },

  async addAccount(accountData: {
    userId: string;
    email: string;
    imapHost: string;
    imapPort: number;
    imapUsername: string;
    imapPassword: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData),
    });
    return response.json();
  },

  async syncAccount(accountId: string) {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/sync`, {
      method: 'POST',
    });
    return response.json();
  },

  async getEmails(params: {
    userId: string;
    accountId?: string;
    folder?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ emails: Email[]; total: number }> {
    const queryParams = new URLSearchParams(params as any);
    const response = await fetch(`${API_BASE_URL}/emails?${queryParams}`);
    const data = await response.json();
    return data;
  },

  async getEmail(emailId: string, userId: string): Promise<Email> {
    const response = await fetch(`${API_BASE_URL}/emails/${emailId}?userId=${userId}`);
    const data = await response.json();
    return data.email;
  },

  async searchEmails(query: string, filters?: {
    accountId?: string;
    folder?: string;
    category?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/emails/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...filters }),
    });
    return response.json();
  },

  async getSuggestedReply(emailId: string, userId: string) {
    const response = await fetch(`${API_BASE_URL}/emails/${emailId}/suggested-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  },

  async saveProductContext(data: {
    userId: string;
    productName: string;
    description: string;
    outreachAgenda: string;
    meetingLink?: string;
    additionalContext?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/product-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getProductContext(userId: string) {
    const response = await fetch(`${API_BASE_URL}/product-context?userId=${userId}`);
    return response.json();
  },
};

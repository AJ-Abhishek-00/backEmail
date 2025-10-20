/*
  # Email Onebox System Schema

  ## Overview
  This migration creates the complete database schema for a feature-rich email onebox aggregator
  supporting multiple IMAP accounts, AI categorization, and search functionality.

  ## Tables Created

  ### 1. email_accounts
  Stores IMAP account credentials and connection settings for multiple email accounts
  - `id` (uuid, primary key) - Unique account identifier
  - `user_id` (uuid) - Reference to auth.users
  - `email` (text) - Email address
  - `imap_host` (text) - IMAP server hostname
  - `imap_port` (int) - IMAP server port
  - `imap_username` (text) - IMAP username
  - `imap_password` (text) - Encrypted IMAP password
  - `sync_enabled` (boolean) - Whether sync is active
  - `last_sync_at` (timestamptz) - Last successful sync timestamp
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. emails
  Stores synchronized emails from all connected accounts
  - `id` (uuid, primary key) - Unique email identifier
  - `account_id` (uuid, foreign key) - Reference to email_accounts
  - `message_id` (text) - Original email message ID
  - `uid` (text) - IMAP UID
  - `subject` (text) - Email subject line
  - `from_address` (text) - Sender email address
  - `from_name` (text) - Sender display name
  - `to_addresses` (jsonb) - Array of recipient addresses
  - `cc_addresses` (jsonb) - Array of CC addresses
  - `folder` (text) - IMAP folder/mailbox name
  - `body_text` (text) - Plain text email body
  - `body_html` (text) - HTML email body
  - `received_at` (timestamptz) - Email received timestamp
  - `is_read` (boolean) - Read status
  - `category` (text) - AI-assigned category
  - `category_confidence` (float) - AI confidence score
  - `indexed_at` (timestamptz) - Elasticsearch indexing timestamp
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. email_categories
  Tracks available email categories and their descriptions
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text) - Category name
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Category creation timestamp

  ### 4. webhook_logs
  Logs webhook delivery attempts for interested emails
  - `id` (uuid, primary key) - Unique log identifier
  - `email_id` (uuid, foreign key) - Reference to emails
  - `webhook_url` (text) - Target webhook URL
  - `status` (text) - Delivery status
  - `response_code` (int) - HTTP response code
  - `response_body` (text) - Response body
  - `attempted_at` (timestamptz) - Delivery attempt timestamp

  ### 5. product_context
  Stores product information and outreach context for AI reply generation
  - `id` (uuid, primary key) - Unique context identifier
  - `user_id` (uuid) - Reference to auth.users
  - `product_name` (text) - Product/service name
  - `description` (text) - Product description
  - `outreach_agenda` (text) - Outreach purpose and goals
  - `meeting_link` (text) - Calendar booking link
  - `additional_context` (text) - Additional context for AI
  - `embedding` (vector(1536)) - Vector embedding for RAG
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own email accounts and related data
  - Restrictive policies require authentication and ownership verification

  ## Indexes
  - Performance indexes on frequently queried columns
  - Foreign key indexes for efficient joins
  - Timestamp indexes for date-range queries
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create email_accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  imap_host text NOT NULL,
  imap_port int NOT NULL DEFAULT 993,
  imap_username text NOT NULL,
  imap_password text NOT NULL,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  message_id text NOT NULL,
  uid text NOT NULL,
  subject text,
  from_address text NOT NULL,
  from_name text,
  to_addresses jsonb DEFAULT '[]'::jsonb,
  cc_addresses jsonb DEFAULT '[]'::jsonb,
  folder text NOT NULL DEFAULT 'INBOX',
  body_text text,
  body_html text,
  received_at timestamptz NOT NULL,
  is_read boolean DEFAULT false,
  category text,
  category_confidence float,
  indexed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(account_id, message_id)
);

-- Create email_categories table
CREATE TABLE IF NOT EXISTS email_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
  webhook_url text NOT NULL,
  status text NOT NULL,
  response_code int,
  response_body text,
  attempted_at timestamptz DEFAULT now()
);

-- Create product_context table for RAG
CREATE TABLE IF NOT EXISTS product_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  description text NOT NULL,
  outreach_agenda text NOT NULL,
  meeting_link text,
  additional_context text,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default email categories
INSERT INTO email_categories (name, description) VALUES
  ('Interested', 'Lead shows interest in the product/service'),
  ('Meeting Booked', 'Meeting has been scheduled'),
  ('Not Interested', 'Lead explicitly declined or not interested'),
  ('Spam', 'Spam or irrelevant email'),
  ('Out of Office', 'Automated out-of-office reply')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_account_id ON emails(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder);
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_email_id ON webhook_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_product_context_user_id ON product_context(user_id);

-- Enable Row Level Security
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_accounts
CREATE POLICY "Users can view own email accounts"
  ON email_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email accounts"
  ON email_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts"
  ON email_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email accounts"
  ON email_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for emails
CREATE POLICY "Users can view emails from own accounts"
  ON emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert emails to own accounts"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update emails from own accounts"
  ON emails FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete emails from own accounts"
  ON emails FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = emails.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for email_categories (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view categories"
  ON email_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for webhook_logs
CREATE POLICY "Users can view webhook logs for own emails"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emails
      JOIN email_accounts ON email_accounts.id = emails.account_id
      WHERE emails.id = webhook_logs.email_id
      AND email_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert webhook logs for own emails"
  ON webhook_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emails
      JOIN email_accounts ON email_accounts.id = emails.account_id
      WHERE emails.id = webhook_logs.email_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for product_context
CREATE POLICY "Users can view own product context"
  ON product_context FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own product context"
  ON product_context FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own product context"
  ON product_context FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own product context"
  ON product_context FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
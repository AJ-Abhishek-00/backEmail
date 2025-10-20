# Email Onebox - Setup Guide

A feature-rich email aggregator with real-time IMAP synchronization, AI-powered categorization, Elasticsearch search, and intelligent reply suggestions.

## Features Implemented

### ✅ Core Features
1. **Real-Time Email Synchronization**
   - Multiple IMAP accounts support (minimum 2)
   - Last 30 days of emails fetched automatically
   - Persistent IMAP connections with IDLE mode (no cron jobs)
   - Real-time notifications when new emails arrive

2. **Elasticsearch Integration**
   - Locally hosted Elasticsearch instance via Docker
   - Full-text search across all emails
   - Filter by folder, account, and category
   - Advanced indexing for fast search

3. **AI-Based Email Categorization**
   - Automatic categorization using OpenAI GPT-3.5
   - Categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office
   - Confidence scores for each categorization

4. **Slack & Webhook Integration**
   - Slack notifications for "Interested" emails
   - Webhook triggers for external automation
   - Webhook delivery logging

5. **Frontend Interface**
   - Beautiful, responsive UI built with React + Tailwind CSS
   - Email list with filtering and search
   - Detailed email view
   - Category-based organization

6. **AI-Powered Suggested Replies (RAG)**
   - Vector database storage for product context
   - RAG-based reply generation using GPT-4
   - Personalized responses based on your product/service
   - Meeting link integration

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- OpenAI API Key
- Supabase Account (already configured)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Elasticsearch

```bash
docker-compose up -d
```

Verify Elasticsearch is running:
```bash
curl http://localhost:9200
```

### 3. Configure Environment Variables

Update the `.env` file with your credentials:

```env
# Supabase (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Slack (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url

# Webhook for automation (use webhook.site)
WEBHOOK_URL=https://webhook.site/your-unique-url

# Server Port
PORT=3001
```

### 4. Start the Backend Server

```bash
npm run server
```

The server will:
- Initialize Elasticsearch indices
- Start syncing configured email accounts
- Listen on port 3001

### 5. Start the Frontend

In a new terminal:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Using the Application

### 1. Create an Account

- Visit the application
- Sign up with email and password
- Authentication is handled by Supabase

### 2. Add Email Accounts

- Click "Add Account" button
- Enter your IMAP details:
  - Email address
  - IMAP host (e.g., `imap.gmail.com`)
  - IMAP port (usually 993)
  - Username (usually your email)
  - Password (use App Password for Gmail)

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password instead of your regular password

### 3. Set Up Product Context (for AI Replies)

- Click "Product Context" in the sidebar
- Fill in:
  - Product/Service name
  - Description
  - Outreach agenda
  - Meeting booking link (optional)
  - Additional context

This information will be used by the AI to generate personalized reply suggestions.

### 4. View and Manage Emails

- Browse emails in the main view
- Filter by category (Interested, Meeting Booked, etc.)
- Use the search bar for full-text search
- Click any email to view details
- Click "Suggested Reply" to get AI-generated responses

## API Endpoints (for Postman Testing)

### Email Accounts

**Create Account**
```
POST http://localhost:3001/api/accounts
Content-Type: application/json

{
  "userId": "your-user-id",
  "email": "you@example.com",
  "imapHost": "imap.gmail.com",
  "imapPort": 993,
  "imapUsername": "you@example.com",
  "imapPassword": "your-app-password"
}
```

**Get Accounts**
```
GET http://localhost:3001/api/accounts?userId=your-user-id
```

**Start Sync**
```
POST http://localhost:3001/api/accounts/{accountId}/sync
```

### Emails

**Get Emails**
```
GET http://localhost:3001/api/emails?userId=your-user-id&category=Interested
```

**Get Single Email**
```
GET http://localhost:3001/api/emails/{emailId}?userId=your-user-id
```

**Search Emails**
```
POST http://localhost:3001/api/emails/search
Content-Type: application/json

{
  "query": "meeting",
  "category": "Interested"
}
```

**Get Suggested Reply**
```
POST http://localhost:3001/api/emails/{emailId}/suggested-reply
Content-Type: application/json

{
  "userId": "your-user-id"
}
```

### Product Context

**Save Product Context**
```
POST http://localhost:3001/api/product-context
Content-Type: application/json

{
  "userId": "your-user-id",
  "productName": "My Product",
  "description": "Product description",
  "outreachAgenda": "I am applying for a job. Share meeting link if interested.",
  "meetingLink": "https://cal.com/example"
}
```

**Get Product Context**
```
GET http://localhost:3001/api/product-context?userId=your-user-id
```

### System

**Health Check**
```
GET http://localhost:3001/health
```

**Elasticsearch Health**
```
GET http://localhost:3001/api/elasticsearch/health
```

## Architecture

### Backend Stack
- **Node.js + Express**: REST API server
- **TypeScript**: Type safety
- **IMAP**: Real-time email synchronization
- **Elasticsearch**: Full-text search engine
- **OpenAI GPT-3.5**: Email categorization
- **OpenAI GPT-4**: Suggested replies
- **Supabase**: Database and authentication

### Frontend Stack
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Vite**: Build tool

### Database Schema

**email_accounts**: Stores IMAP account credentials
**emails**: Stores synchronized emails
**email_categories**: Predefined email categories
**webhook_logs**: Webhook delivery logs
**product_context**: Product information for AI replies

## Troubleshooting

### Elasticsearch Connection Issues
```bash
# Check if Elasticsearch is running
docker ps

# Check logs
docker logs email-onebox-elasticsearch

# Restart
docker-compose restart
```

### IMAP Connection Issues
- Verify credentials are correct
- For Gmail, use App Passwords
- Check firewall settings
- Enable IMAP in email provider settings

### OpenAI API Issues
- Verify API key is valid
- Check API quota and billing
- Ensure internet connection is stable

## Development

### Backend Development
```bash
npm run server:dev
```

### Frontend Development
```bash
npm run dev
```

### Type Checking
```bash
npm run typecheck
```

### Build for Production
```bash
npm run build
```

## Feature Completion Checklist

- ✅ Real-time IMAP synchronization with IDLE mode
- ✅ Multiple account support (minimum 2)
- ✅ Last 30 days email fetching
- ✅ Elasticsearch integration and indexing
- ✅ Search by folder and account
- ✅ AI-based email categorization (5 categories)
- ✅ Slack notifications for interested emails
- ✅ Webhook integration for automation
- ✅ Frontend UI with email display
- ✅ Filter by folder/account/category
- ✅ Elasticsearch-powered search
- ✅ AI-powered suggested replies with RAG
- ✅ Vector database for product context
- ✅ Meeting link integration in replies

## Notes

- The system uses persistent IMAP connections (no polling)
- All emails are automatically categorized by AI
- Interested emails trigger Slack notifications and webhooks
- Product context powers the AI reply suggestions
- All data is stored securely in Supabase with RLS policies

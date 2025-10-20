# Email Onebox - API Documentation

Complete REST API documentation for backend testing with Postman.

## Base URL
```
http://localhost:3001/api
```

## Authentication

All endpoints require a valid user ID. Authentication is handled through Supabase, but for API testing, you can use any valid user ID from your database.

---

## Email Accounts

### Create Email Account
Add a new IMAP email account to the system.

**Endpoint:** `POST /accounts`

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "imapHost": "imap.gmail.com",
  "imapPort": 993,
  "imapUsername": "test@example.com",
  "imapPassword": "app-specific-password",
  "syncEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "account": {
    "id": "account-uuid",
    "user_id": "user-uuid",
    "email": "test@example.com",
    "imap_host": "imap.gmail.com",
    "imap_port": 993,
    "sync_enabled": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Accounts
Retrieve all email accounts for a user.

**Endpoint:** `GET /accounts?userId={userId}`

**Response:**
```json
{
  "accounts": [
    {
      "id": "account-uuid",
      "email": "test@example.com",
      "imap_host": "imap.gmail.com",
      "sync_enabled": true,
      "last_sync_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Start Account Sync
Manually trigger synchronization for an account.

**Endpoint:** `POST /accounts/{accountId}/sync`

**Response:**
```json
{
  "success": true,
  "message": "Sync started"
}
```

### Stop Account Sync
Stop synchronization for an account.

**Endpoint:** `POST /accounts/{accountId}/stop`

**Response:**
```json
{
  "success": true,
  "message": "Sync stopped"
}
```

---

## Emails

### Get Emails
Retrieve emails with optional filtering.

**Endpoint:** `GET /emails`

**Query Parameters:**
- `userId` (required): User ID
- `accountId` (optional): Filter by specific account
- `folder` (optional): Filter by folder (e.g., "INBOX")
- `category` (optional): Filter by AI category
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
GET /emails?userId=user-uuid&category=Interested&limit=20
```

**Response:**
```json
{
  "emails": [
    {
      "id": "email-uuid",
      "account_id": "account-uuid",
      "subject": "Meeting Request",
      "from_address": "sender@example.com",
      "from_name": "John Doe",
      "body_text": "Email body...",
      "folder": "INBOX",
      "category": "Interested",
      "category_confidence": 0.95,
      "received_at": "2024-01-01T00:00:00.000Z",
      "is_read": false,
      "email_accounts": {
        "email": "test@example.com"
      }
    }
  ],
  "total": 100
}
```

### Get Single Email
Retrieve a specific email by ID.

**Endpoint:** `GET /emails/{emailId}?userId={userId}`

**Response:**
```json
{
  "email": {
    "id": "email-uuid",
    "subject": "Meeting Request",
    "from_address": "sender@example.com",
    "from_name": "John Doe",
    "body_text": "Full email body...",
    "body_html": "<html>Email HTML...</html>",
    "category": "Interested",
    "received_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Search Emails
Search emails using Elasticsearch.

**Endpoint:** `POST /emails/search`

**Request Body:**
```json
{
  "query": "meeting schedule",
  "accountId": "account-uuid",
  "folder": "INBOX",
  "category": "Interested",
  "from": 0,
  "size": 50
}
```

**Response:**
```json
{
  "total": 15,
  "hits": [
    {
      "id": "email-uuid",
      "score": 5.2,
      "subject": "Meeting Schedule",
      "from_address": "sender@example.com",
      "body_text": "Let's schedule a meeting...",
      "category": "Interested"
    }
  ]
}
```

### Categorize Email
Manually trigger AI categorization for an email.

**Endpoint:** `POST /emails/{emailId}/categorize?userId={userId}`

**Response:**
```json
{
  "success": true,
  "category": "Interested",
  "confidence": 0.95,
  "reasoning": "The sender explicitly shows interest in the product"
}
```

---

## Email Categories

### Get Categories
Retrieve all available email categories.

**Endpoint:** `GET /categories`

**Response:**
```json
{
  "categories": [
    {
      "id": "category-uuid",
      "name": "Interested",
      "description": "Lead shows interest in the product/service"
    },
    {
      "id": "category-uuid",
      "name": "Meeting Booked",
      "description": "Meeting has been scheduled"
    },
    {
      "id": "category-uuid",
      "name": "Not Interested",
      "description": "Lead explicitly declined or not interested"
    },
    {
      "id": "category-uuid",
      "name": "Spam",
      "description": "Spam or irrelevant email"
    },
    {
      "id": "category-uuid",
      "name": "Out of Office",
      "description": "Automated out-of-office reply"
    }
  ]
}
```

---

## Product Context (RAG)

### Save Product Context
Store product information for AI-powered reply generation.

**Endpoint:** `POST /product-context`

**Request Body:**
```json
{
  "userId": "user-uuid",
  "productName": "Acme CRM",
  "description": "A comprehensive CRM solution for small businesses",
  "outreachAgenda": "I am applying for a job position. If the lead is interested, share the meeting booking link.",
  "meetingLink": "https://cal.com/example",
  "additionalContext": "We specialize in automation and integration with popular tools"
}
```

**Response:**
```json
{
  "success": true,
  "context": {
    "id": "context-uuid",
    "user_id": "user-uuid",
    "product_name": "Acme CRM",
    "description": "A comprehensive CRM solution...",
    "meeting_link": "https://cal.com/example",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Product Context
Retrieve stored product context.

**Endpoint:** `GET /product-context?userId={userId}`

**Response:**
```json
{
  "contexts": [
    {
      "id": "context-uuid",
      "product_name": "Acme CRM",
      "description": "A comprehensive CRM solution...",
      "outreach_agenda": "I am applying for a job position...",
      "meeting_link": "https://cal.com/example",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## AI Suggested Replies

### Generate Suggested Reply
Get an AI-generated reply suggestion for an email.

**Endpoint:** `POST /emails/{emailId}/suggested-reply`

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "suggestedReply": "Thank you for your interest in Acme CRM! I'd be happy to discuss how our solution can help your business. You can schedule a meeting with me at your convenience: https://cal.com/example\n\nLooking forward to speaking with you!\n\nBest regards"
}
```

---

## Webhook Logs

### Get Webhook Logs
Retrieve webhook delivery logs.

**Endpoint:** `GET /webhook-logs?userId={userId}&emailId={emailId}`

**Response:**
```json
{
  "logs": [
    {
      "id": "log-uuid",
      "email_id": "email-uuid",
      "webhook_url": "https://webhook.site/abc123",
      "status": "success",
      "response_code": 200,
      "response_body": "OK",
      "attempted_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## System Endpoints

### Health Check
Check if the API server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Elasticsearch Health
Check Elasticsearch connection and status.

**Endpoint:** `GET /elasticsearch/health`

**Response:**
```json
{
  "status": "ok",
  "elasticsearch": {
    "cluster_name": "docker-cluster",
    "status": "yellow",
    "number_of_nodes": 1
  }
}
```

### Sync All Accounts
Trigger synchronization for all enabled accounts.

**Endpoint:** `POST /sync-all`

**Response:**
```json
{
  "success": true,
  "message": "Started syncing all accounts"
}
```

---

## Testing Workflow with Postman

### 1. Setup
1. Import this documentation into Postman
2. Set up environment variables:
   - `baseUrl`: `http://localhost:3001/api`
   - `userId`: Your user ID from Supabase

### 2. Add Email Account
```
POST {{baseUrl}}/accounts
```
Use Gmail App Password for testing.

### 3. Verify Account Added
```
GET {{baseUrl}}/accounts?userId={{userId}}
```

### 4. Start Sync
```
POST {{baseUrl}}/accounts/{accountId}/sync
```

### 5. Wait for Emails to Sync
Give it a few minutes for IMAP to fetch emails.

### 6. Get Emails
```
GET {{baseUrl}}/emails?userId={{userId}}&limit=10
```

### 7. Search Emails
```
POST {{baseUrl}}/emails/search
Body: { "query": "meeting" }
```

### 8. Set Product Context
```
POST {{baseUrl}}/product-context
Body: { "userId": "...", "productName": "...", ... }
```

### 9. Get Suggested Reply
```
POST {{baseUrl}}/emails/{emailId}/suggested-reply
Body: { "userId": "..." }
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (missing parameters)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider:
- Rate limiting per IP
- Rate limiting per user
- Queue for AI operations

---

## Notes

1. **Authentication**: For production, add JWT token validation
2. **CORS**: Currently allows all origins (`*`)
3. **Real-time Updates**: IMAP IDLE mode provides real-time email notifications
4. **AI Categorization**: Happens automatically when emails are synced
5. **Slack/Webhook**: Automatically triggered for "Interested" emails
6. **Vector Embeddings**: Generated automatically when saving product context

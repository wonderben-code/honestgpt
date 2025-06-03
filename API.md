# honestGPT API Documentation

Base URL: `https://api.honestgpt.com/api` (or `http://localhost:3001/api` for development)

## Authentication

All API endpoints (except auth endpoints) require authentication using JWT tokens.

Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

For API key authentication (team tier only):
```
x-api-key: YOUR_API_KEY
```

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "referralCode": "ABCD1234" // optional
}

Response:
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "free"
  },
  "token": "jwt_token"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "token": "jwt_token"
}
```

#### Verify Token
```http
GET /auth/verify
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "valid": true,
  "user": {...}
}
```

### Chat

#### Send Message
```http
POST /chat/message
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "What are the health effects of 5G?",
  "conversationId": "uuid", // optional
  "searchOnly": false // optional, returns only search results
}

Response:
{
  "success": true,
  "response": {
    "confidence": 85,
    "confidenceLevel": "high",
    "mainResponse": "Based on extensive research...",
    "shortResponse": "5G is safe according to...",
    "sources": [...],
    "factors": {
      "sourceQuality": {...},
      "sourceAgreement": {...},
      "recencyScore": {...},
      "certaintyScore": {...}
    },
    "biases": ["Sources primarily from US perspectives"],
    "controversies": ["Some debate exists about..."],
    "limitations": "Long-term studies still ongoing"
  },
  "metadata": {
    "searchResultsAnalyzed": 10,
    "sourcesUsed": 5,
    "responseLength": 1234,
    "timestamp": "2024-01-20T..."
  }
}
```

#### List Conversations
```http
GET /chat/conversations?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "title": "5G Health Effects",
      "created_at": "2024-01-20T...",
      "updated_at": "2024-01-20T...",
      "lastMessage": {
        "content": "Based on research...",
        "role": "assistant",
        "created_at": "2024-01-20T..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Conversation
```http
GET /chat/conversation/:conversationId
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "title": "5G Health Effects",
    "messages": [...],
    "created_at": "2024-01-20T...",
    "updated_at": "2024-01-20T..."
  }
}
```

#### Export Conversation
```http
GET /chat/conversation/:conversationId/export?format=json
Authorization: Bearer YOUR_JWT_TOKEN

Formats: json, markdown, txt
```

### User

#### Get Profile
```http
GET /user/profile
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "pro",
    "usage_count": 45,
    "usage_limit": 200,
    "usage_reset_date": "2024-02-01T..."
  }
}
```

#### Update Profile
```http
PUT /user/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "newemail@example.com",
  "currentPassword": "oldpassword", // required for password change
  "newPassword": "newpassword" // optional
}
```

#### Get Usage Statistics
```http
GET /user/usage?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "usage": {
    "current": {
      "tier": "pro",
      "used": 45,
      "limit": 200,
      "remaining": 155,
      "resetDate": "2024-02-01T..."
    },
    "history": {
      "totalQueries": 245,
      "totalCost": 24.50,
      "byDay": {...},
      "byType": {...}
    }
  }
}
```

### API Keys (Team Tier Only)

#### List API Keys
```http
GET /user/api-keys
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "success": true,
  "apiKeys": [
    {
      "id": "uuid",
      "name": "Production App",
      "key_prefix": "hgpt_ABC1",
      "is_active": true,
      "usage_count": 1234,
      "last_used": "2024-01-20T...",
      "created_at": "2024-01-01T..."
    }
  ]
}
```

#### Create API Key
```http
POST /user/api-keys
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Production App"
}

Response:
{
  "success": true,
  "apiKey": {
    "id": "uuid",
    "name": "Production App",
    "key": "hgpt_FULL_KEY_SHOWN_ONCE", // Only shown on creation
    "key_prefix": "hgpt_ABC1",
    "created_at": "2024-01-20T..."
  },
  "message": "Save this API key securely. It will not be shown again."
}
```

### Payments

#### Create Checkout Session
```http
POST /payment/create-checkout-session
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "tier": "pro" // or "team"
}

Response:
{
  "sessionId": "cs_xxx",
  "sessionUrl": "https://checkout.stripe.com/..."
}
```

#### Get Subscription
```http
GET /payment/subscription
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "tier": "pro",
  "usageLimit": 200,
  "usageCount": 45,
  "subscription": {
    "status": "active",
    "currentPeriodEnd": "2024-02-01T...",
    "cancelAtPeriodEnd": false
  }
}
```

## Rate Limits

Rate limits are based on subscription tier:

- **Free**: 10 requests per month
- **Pro**: 200 requests per month  
- **Team**: 1,000 requests per month

API keys (team tier) have additional rate limits:
- 60 requests per minute

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "message": "Detailed explanation", // optional
  "details": "Validation details" // optional
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Webhooks

For Stripe integration, configure webhook endpoint:
```
POST /api/payment/webhook
```

Events handled:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## API Usage with cURL Examples

### Basic Query
```bash
curl -X POST https://api.honestgpt.com/api/chat/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Is nuclear energy safe?"}'
```

### With API Key
```bash
curl -X POST https://api.honestgpt.com/api/chat/message \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "What causes climate change?"}'
```

## SDK Usage (Planned)

### JavaScript/Node.js
```javascript
import { HonestGPT } from 'honestgpt-sdk';

const client = new HonestGPT({
  apiKey: 'YOUR_API_KEY'
});

const response = await client.chat.send({
  message: 'Is AI consciousness possible?'
});

console.log(`Confidence: ${response.confidence}%`);
console.log(`Response: ${response.mainResponse}`);
console.log(`Sources: ${response.sources.length}`);
```

### Python
```python
from honestgpt import HonestGPT

client = HonestGPT(api_key="YOUR_API_KEY")

response = client.chat.send(
    message="What are the risks of AGI?"
)

print(f"Confidence: {response.confidence}%")
print(f"Response: {response.main_response}")
for source in response.sources:
    print(f"- {source.title} ({source.quality})")
```
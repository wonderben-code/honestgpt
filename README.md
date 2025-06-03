# honestGPT - Transparent AI with Confidence Scores

honestGPT is a ChatGPT alternative that prioritizes transparency and honesty. It performs real-time web searches, calculates confidence scores based on source quality, and clearly communicates uncertainty when appropriate.

## Features

- 🔍 **Real-time Web Search**: Searches trusted sources (.gov, .edu, peer-reviewed journals) for every query
- 📊 **Confidence Scores**: Shows 0-100% confidence based on source quality, consensus, recency, and certainty
- 📚 **Source Citations**: Every claim linked to verifiable sources with quality ratings
- 🎯 **Honest Uncertainty**: Says "I don't know" when evidence is weak or conflicting
- 🔐 **Tiered Access**: Free tier for trying, Pro for researchers, Team for organizations
- 💳 **Stripe Integration**: Secure payment processing for subscriptions
- 🚀 **Production Ready**: Built with scalability, security, and monitoring in mind

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL (via Supabase)
- OpenAI GPT-4 API
- Google Custom Search API
- JWT Authentication
- Stripe Payment Processing

**Frontend:**
- React 18 with hooks
- Tailwind CSS
- Vite build tool
- Zustand state management
- React Router v6

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- PostgreSQL database (we recommend Supabase)
- API keys for:
  - OpenAI GPT-4
  - Google Custom Search
  - Stripe
  - Supabase

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/honestgpt.git
cd honestgpt
```

### 2. Set up the backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run migrate  # Run database migrations
npm run dev      # Start development server
```

### 3. Set up the frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev      # Start development server
```

### 4. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Getting API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `OPENAI_API_KEY` in backend `.env`

### Google Custom Search API
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Custom Search API
4. Create credentials (API Key)
5. Go to https://programmablesearchengine.google.com/
6. Create a new search engine
7. Configure to search the entire web
8. Get the Search Engine ID
9. Add both to backend `.env`:
   - `GOOGLE_SEARCH_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`

### Stripe Setup
1. Go to https://dashboard.stripe.com/
2. Get your API keys from Developers → API keys
3. Create products and prices for Pro ($19) and Team ($99) tiers
4. Set up webhook endpoint for `/api/payment/webhook`
5. Add to backend `.env`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID_PRO`
   - `STRIPE_PRICE_ID_TEAM`

### Supabase Setup
1. Go to https://supabase.com/
2. Create a new project
3. Go to Settings → API
4. Copy the project URL and anon key
5. Run the SQL from `backend/db/schema.sql` in SQL editor
6. Add to backend `.env`:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Database (Supabase)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# APIs
OPENAI_API_KEY=sk-...
GOOGLE_SEARCH_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_TEAM=price_...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and subscription info
- `conversations` - Chat conversations
- `messages` - Individual messages with confidence scores
- `usage_logs` - Track API usage for billing
- `payments` - Payment history

See `backend/db/schema.sql` for the complete schema.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify JWT token

### Chat
- `POST /api/chat/message` - Send message and get AI response
- `GET /api/chat/conversations` - List user's conversations
- `GET /api/chat/conversation/:id` - Get specific conversation
- `DELETE /api/chat/conversation/:id` - Delete conversation

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/usage` - Get usage statistics

### Payments
- `POST /api/payment/create-checkout-session` - Start Stripe checkout
- `POST /api/payment/webhook` - Handle Stripe webhooks
- `GET /api/payment/subscription` - Get subscription details

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment:
- Frontend: Deploy to Vercel
- Backend: Deploy to Railway or Render
- Database: Use Supabase (already cloud-hosted)

## Development

### Running tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code structure
```
honestgpt/
├── backend/
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   ├── middleware/     # Auth, rate limiting
│   └── db/            # Database schema
├── frontend/
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/ # Reusable components
│   │   ├── stores/    # Zustand stores
│   │   └── utils/     # Helper functions
│   └── public/        # Static assets
└── docs/              # Additional documentation
```

## Security Considerations

- All API endpoints require authentication (except auth routes)
- Rate limiting based on subscription tier
- Input validation with Joi
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping
- HTTPS required in production
- Secrets stored in environment variables

## Cost Considerations

Per query costs:
- OpenAI GPT-4: ~$0.09
- Google Search: ~$0.005
- Infrastructure: ~$0.001
- **Total: ~$0.096 per query**

Pricing is set to ensure profitability:
- Free tier: 10 queries (loss leader)
- Pro tier: 200 queries for $19 (break-even)
- Team tier: 1000 queries for $99 (profitable)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- Documentation: See `/docs` folder
- Issues: GitHub Issues
- Email: support@honestgpt.com

## Acknowledgments

- OpenAI for GPT-4 API
- Google for Custom Search API
- Stripe for payment processing
- Supabase for database hosting
- All open source libraries used
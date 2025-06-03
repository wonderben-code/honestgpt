# honestGPT Deployment Guide

This guide walks you through deploying honestGPT to production using:
- **Frontend**: Vercel
- **Backend**: Railway or Render
- **Database**: Supabase (already cloud-based)
- **Domain**: Your custom domain

## Prerequisites

1. All API keys obtained (OpenAI, Google Search, Stripe, Supabase)
2. GitHub repository with your code
3. Accounts created on Vercel and Railway/Render
4. Domain name (optional but recommended)

## Step 1: Database Setup (Supabase)

1. **Create Supabase Project**
   ```
   - Go to https://supabase.com
   - Create new project
   - Choose region closest to your users
   - Save the database password
   ```

2. **Run Database Schema**
   ```
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of backend/db/schema.sql
   - Run the SQL to create all tables
   ```

3. **Enable Row Level Security**
   ```
   - Already included in schema.sql
   - Verify RLS is enabled on all tables
   ```

4. **Get Connection Details**
   ```
   - Go to Settings → API
   - Copy:
     - Project URL (SUPABASE_URL)
     - Anon/Public key (SUPABASE_ANON_KEY)
   - Go to Settings → Database
   - Copy connection string (DATABASE_URL)
   ```

## Step 2: Backend Deployment (Railway)

1. **Prepare Backend Code**
   ```bash
   cd backend
   # Ensure package.json has "start" script
   # Remove any .env files from git
   ```

2. **Deploy to Railway**
   ```
   - Go to https://railway.app
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository
   - Choose backend directory
   ```

3. **Configure Environment Variables**
   In Railway dashboard, add all variables:
   ```
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://your-app.vercel.app
   
   # Database (from Supabase)
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   
   # Auth
   JWT_SECRET=generate-long-random-string
   
   # APIs
   OPENAI_API_KEY=sk-...
   GOOGLE_SEARCH_API_KEY=...
   GOOGLE_SEARCH_ENGINE_ID=...
   
   # Stripe
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_PRO=price_...
   STRIPE_PRICE_ID_TEAM=price_...
   ```

4. **Get Backend URL**
   ```
   - Railway provides a URL like: https://your-app.railway.app
   - Save this for frontend configuration
   ```

## Step 3: Frontend Deployment (Vercel)

1. **Prepare Frontend Code**
   ```bash
   cd frontend
   # Update .env with production values
   # Build locally to test
   npm run build
   ```

2. **Deploy to Vercel**
   ```
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select frontend directory as root
   - Framework preset: Vite
   ```

3. **Configure Environment Variables**
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   VITE_ENV=production
   ```

4. **Configure Build Settings**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

## Step 4: Stripe Webhook Configuration

1. **Add Webhook Endpoint**
   ```
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: https://your-backend.railway.app/api/payment/webhook
   - Select events:
     - checkout.session.completed
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
   ```

2. **Update Webhook Secret**
   ```
   - Copy the webhook signing secret
   - Update STRIPE_WEBHOOK_SECRET in Railway
   ```

## Step 5: Domain Configuration

### For Frontend (Vercel)
1. Go to Vercel project settings → Domains
2. Add your domain (e.g., honestgpt.com)
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic)

### For Backend (Optional)
1. Use Railway's provided URL, or
2. Add custom domain in Railway settings
3. Configure subdomain (e.g., api.honestgpt.com)

## Step 6: Post-Deployment

1. **Update CORS**
   ```
   - Update FRONTEND_URL in Railway to production domain
   - Redeploy backend
   ```

2. **Test Everything**
   ```
   - Create test account
   - Send test message
   - Test payment flow with Stripe test card
   - Verify webhooks are working
   ```

3. **Enable Monitoring**
   ```
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Set up alerts for errors
   ```

4. **Database Backups**
   ```
   - Enable daily backups in Supabase
   - Download backup before major changes
   ```

## Production Checklist

- [ ] All environment variables set correctly
- [ ] HTTPS enabled on all domains
- [ ] Stripe webhook configured and tested
- [ ] Rate limiting configured
- [ ] Error logging enabled
- [ ] Database backups enabled
- [ ] Custom domain configured
- [ ] CORS properly configured
- [ ] JWT secret is strong and unique
- [ ] All test console.logs removed
- [ ] Source maps disabled in production
- [ ] robots.txt configured

## Scaling Considerations

### When you need to scale:

1. **Database**
   - Upgrade Supabase plan for more connections
   - Enable connection pooling
   - Add read replicas if needed

2. **Backend**
   - Railway auto-scales
   - Or migrate to Kubernetes for more control
   - Add Redis for caching

3. **Frontend**
   - Vercel auto-scales
   - Enable ISR for marketing pages
   - Use CDN for assets

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check FRONTEND_URL in backend env
   - Ensure protocol (https://) is included

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check connection limits
   - Enable connection pooling

3. **Stripe Webhooks Failing**
   - Verify webhook secret
   - Check endpoint URL
   - Look at Stripe webhook logs

4. **High Costs**
   - Monitor OpenAI usage
   - Implement caching
   - Review query optimization

## Maintenance

### Regular Tasks:
- Monitor error logs weekly
- Review usage analytics
- Update dependencies monthly
- Backup database before updates
- Test payment flow monthly

### Updating Code:
1. Test locally first
2. Deploy backend, wait for success
3. Deploy frontend
4. Test all critical paths

## Support

If you encounter issues:
1. Check logs in Railway/Vercel dashboard
2. Review error tracking in Sentry
3. Check Supabase logs for database issues
4. Contact support@honestgpt.com

Remember: Always test in production after deployment!
# 🚀 honestGPT Complete Deployment Guide (Super Easy Version)

This guide will take you from zero to a live honestGPT website. Follow each step exactly - I'll explain everything!

## 📋 What You'll Need (Prerequisites)

Before we start, make sure you have:
1. A computer with internet
2. A credit card (for API services - most have free tiers)
3. About 1-2 hours of time
4. Basic ability to copy/paste

## 🎯 Overview - What We're Doing

We're going to:
1. Get all the API keys we need (like getting keys to different doors)
2. Set up our database (where we store user data)
3. Deploy our backend (the brain of our app)
4. Deploy our frontend (what users see)
5. Connect everything together
6. Go live!

---

# Phase 1: Getting Your API Keys (30 minutes)

Think of API keys like passwords that let our app talk to other services.

## 1.1 OpenAI API Key (For GPT-4)

This lets us use GPT-4 to generate responses.

1. **Go to OpenAI:**
   - Open your browser
   - Go to: https://platform.openai.com/signup
   - Create an account (or sign in if you have one)

2. **Get Your API Key:**
   - Once logged in, click your profile picture (top right)
   - Click "View API keys"
   - Click "Create new secret key"
   - Name it "honestGPT"
   - IMPORTANT: Copy this key immediately! You won't see it again
   - Save it in a text file like this:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
   ```

3. **Add Payment Method:**
   - Go to "Billing" in the sidebar
   - Click "Add payment method"
   - Add your credit card
   - Set a monthly limit of $50 (for safety)

## 1.2 Google Custom Search API

This lets us search the web for current information.

### Part A: Get Google Cloud Account

1. **Go to Google Cloud Console:**
   - Go to: https://console.cloud.google.com/
   - Sign in with your Google account
   - You'll see "Welcome to Google Cloud Platform"

2. **Create a New Project:**
   - Click the dropdown at the top that says "Select a project"
   - Click "NEW PROJECT"
   - Name: "honestGPT"
   - Click "CREATE"
   - Wait 30 seconds for it to create

3. **Enable the Custom Search API:**
   - In the search bar at the top, type "Custom Search API"
   - Click on "Custom Search API" when it appears
   - Click the big blue "ENABLE" button
   - Wait for it to enable (10 seconds)

4. **Create API Credentials:**
   - Click "CREATE CREDENTIALS" (blue button)
   - Choose "API key"
   - A popup shows your API key - COPY IT!
   - Save it like this:
   ```
   GOOGLE_SEARCH_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - Click "RESTRICT KEY"
   - Under "API restrictions", select "Restrict key"
   - Check only "Custom Search API"
   - Click "SAVE"

### Part B: Create Search Engine

1. **Go to Programmable Search Engine:**
   - Go to: https://programmablesearchengine.google.com/
   - Click "Get started"
   - Click "Create a new search engine"

2. **Configure Your Search Engine:**
   - Search engine name: "honestGPT Web Search"
   - What to search: Select "Search the entire web"
   - Search settings: Leave default
   - Click "Create"

3. **Get Your Search Engine ID:**
   - After creation, you'll see "Congratulations!"
   - Click "Customize" or go to "Edit search engine"
   - Find "Search engine ID" (it's a long string)
   - Copy it! Save it like this:
   ```
   GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i9
   ```

## 1.3 Stripe Account (For Payments)

This lets users pay for subscriptions.

1. **Create Stripe Account:**
   - Go to: https://dashboard.stripe.com/register
   - Fill in your email and create account
   - Verify your email

2. **Get Your API Keys:**
   - Once in dashboard, look for "Developers" in sidebar
   - Click "API keys"
   - You'll see "Publishable key" and "Secret key"
   - Copy both! Save them like:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxx
   STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxx
   ```

3. **Create Products and Prices:**
   - Click "Products" in sidebar
   - Click "Add product"
   
   **Product 1 - Pro Tier:**
   - Name: "honestGPT Pro"
   - Description: "200 queries per month"
   - Click "Add product"
   - Under Pricing, click "Add price"
   - Price: $19.00
   - Billing period: Monthly
   - Click "Add price"
   - Copy the price ID (starts with `price_`):
   ```
   STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
   ```

   **Product 2 - Team Tier:**
   - Repeat above with:
   - Name: "honestGPT Team"
   - Description: "1000 queries per month"
   - Price: $99.00
   - Copy the price ID:
   ```
   STRIPE_PRICE_ID_TEAM=price_xxxxxxxxxxxxx
   ```

4. **Set Up Webhook (We'll complete this later):**
   - For now, just note that we need to come back here

## 1.4 Supabase Account (Database)

This is where we store all user data.

1. **Create Supabase Account:**
   - Go to: https://supabase.com/
   - Click "Start your project"
   - Sign up with GitHub or email

2. **Create New Project:**
   - Click "New project"
   - Organization: Choose or create one
   - Project name: "honestgpt"
   - Database Password: Create a strong password and SAVE IT!
   - Region: Choose closest to you
   - Click "Create new project"
   - Wait 2 minutes for setup

3. **Get Your Credentials:**
   - Once ready, go to "Settings" (gear icon)
   - Click "API" in sidebar
   - Copy these values:
   ```
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
   ```

4. **Set Up Database:**
   - Click "SQL Editor" in sidebar
   - Click "New query"
   - Go back to your code files
   - Open `backend/db/schema.sql`
   - Copy ALL the content
   - Paste into SQL editor
   - Click "RUN" (green button)
   - You should see "Success. No rows returned"

5. **Get Database URL:**
   - Go to "Settings" → "Database"
   - Under "Connection string", click "URI"
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your database password
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

---

# Phase 2: Prepare Your Code (15 minutes)

## 2.1 Get the Code Ready

1. **Create a GitHub Account (if you don't have one):**
   - Go to: https://github.com/signup
   - Create account

2. **Create a New Repository:**
   - Click the "+" icon (top right)
   - Click "New repository"
   - Repository name: "honestgpt"
   - Select "Private"
   - Click "Create repository"

3. **Upload Your Code:**
   - You should have all the honestGPT files I created
   - If using GitHub Desktop (easier):
     - Download: https://desktop.github.com/
     - Clone your repository
     - Copy all honestGPT files into the folder
     - Commit and push
   - If using command line:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/honestgpt.git
   git push -u origin main
   ```

## 2.2 Create Environment Files

1. **Create Backend .env file:**
   - In your `backend` folder
   - Create a new file called `.env` (exactly that name)
   - Add all your keys (replace with your actual values):

```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Frontend URL (we'll update this later)
FRONTEND_URL=https://your-app.vercel.app

# Database (Supabase)
DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Authentication
JWT_SECRET=create-a-random-32-character-string-here-like-this-abc123def456

# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Google Search
GOOGLE_SEARCH_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i9

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (we'll get this later)
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_TEAM=price_xxxxxxxxxxxxx
```

2. **Create Frontend .env file:**
   - In your `frontend` folder
   - Create a new file called `.env`
   - Add:

```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxx
```

---

# Phase 3: Deploy Backend (20 minutes)

We'll use Railway because it's the easiest.

## 3.1 Create Railway Account

1. **Sign Up:**
   - Go to: https://railway.app/
   - Click "Login" → "Login with GitHub"
   - Authorize Railway

## 3.2 Deploy Backend

1. **Create New Project:**
   - Click "New Project"
   - Click "Deploy from GitHub repo"
   - Click "Configure GitHub App"
   - Select your honestgpt repository
   - Click "Save"

2. **Select Repository:**
   - Back in Railway, select "honestgpt"
   - Railway starts deploying automatically

3. **Configure Environment Variables:**
   - Click on your deployment
   - Go to "Variables" tab
   - Click "RAW Editor"
   - Paste your entire backend `.env` content
   - Click "Update variables"

4. **Set Root Directory:**
   - Go to "Settings" tab
   - Under "Root Directory", enter: `backend`
   - Click the checkmark

5. **Generate Domain:**
   - Still in Settings
   - Under "Domains", click "Generate Domain"
   - You'll get something like: `honestgpt-backend.railway.app`
   - Copy this URL!

6. **Wait for Deployment:**
   - Go to "Deployments" tab
   - Wait for the deployment to finish (green checkmark)
   - This takes about 5 minutes

7. **Test Your Backend:**
   - Open: `https://your-backend-domain.railway.app/health`
   - You should see: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

---

# Phase 4: Deploy Frontend (20 minutes)

We'll use Vercel because it's perfect for React apps.

## 4.1 Create Vercel Account

1. **Sign Up:**
   - Go to: https://vercel.com/signup
   - Click "Continue with GitHub"
   - Authorize Vercel

## 4.2 Deploy Frontend

1. **Import Project:**
   - Click "New Project"
   - Import your "honestgpt" repository
   - Click "Import"

2. **Configure Project:**
   - Framework Preset: Vite (should auto-detect)
   - Root Directory: Click "Edit" and enter: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables:**
   - Expand "Environment Variables"
   - Add these (update with your Railway backend URL):
   ```
   VITE_API_URL = https://honestgpt-backend.railway.app/api
   VITE_STRIPE_PUBLIC_KEY = pk_test_xxxxxxxxxxxxxxxxxx
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a URL like: `honestgpt-xxxxx.vercel.app`
   - Click "Visit" to see your site!

## 4.3 Update Backend with Frontend URL

1. **Go back to Railway:**
   - Click on your backend project
   - Go to "Variables" tab
   - Update `FRONTEND_URL` with your Vercel URL:
   ```
   FRONTEND_URL=https://honestgpt-xxxxx.vercel.app
   ```
   - The backend will redeploy automatically

---

# Phase 5: Set Up Stripe Webhook (10 minutes)

This lets Stripe tell our app when someone pays.

1. **Go to Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/
   - Click "Developers" → "Webhooks"

2. **Add Endpoint:**
   - Click "Add endpoint"
   - Endpoint URL: `https://your-backend.railway.app/api/payment/webhook`
   - Description: "honestGPT webhook"
   - Events to send: Click "receive all events" (easier)
   - Click "Add endpoint"

3. **Get Webhook Secret:**
   - Click on your new webhook
   - Find "Signing secret"
   - Click "Reveal"
   - Copy it!

4. **Update Backend:**
   - Go to Railway
   - Update `STRIPE_WEBHOOK_SECRET` in variables
   - Let it redeploy

---

# Phase 6: Test Everything (15 minutes)

## 6.1 Create a Test Account

1. **Go to your live site:**
   - Open: `https://honestgpt-xxxxx.vercel.app`
   - Click "Start Free Trial"
   - Create an account
   - You should be able to log in!

## 6.2 Test Chat Feature

1. **Ask a Question:**
   - Go to Chat
   - Type: "What is the capital of France?"
   - Click Send
   - You should see:
     - A confidence score
     - The answer
     - Sources from web search
     - Expandable sections

## 6.3 Test Payment (Optional)

1. **Upgrade Account:**
   - Go to Pricing
   - Click "Get Started" on Pro plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date, any CVC
   - Complete checkout

---

# Phase 7: Custom Domain (Optional, 10 minutes)

## 7.1 Get a Domain

1. **Buy a Domain:**
   - Go to: https://namecheap.com/ or https://domains.google/
   - Search for "honestgpt.com" or your preferred name
   - Purchase (usually $10-15/year)

## 7.2 Connect to Vercel

1. **In Vercel:**
   - Go to your project
   - Go to "Settings" → "Domains"
   - Add your domain
   - Follow Vercel's instructions to update DNS

---

# 🎉 YOU'RE LIVE!

Congratulations! Your honestGPT is now live on the internet!

## What You've Accomplished:
- ✅ Set up a complete web application
- ✅ Integrated with 4 different APIs
- ✅ Deployed a backend server
- ✅ Deployed a frontend website
- ✅ Set up a production database
- ✅ Enabled payment processing

---

# 📝 Important Reminders

## Daily Monitoring

1. **Check Your Costs:**
   - OpenAI: https://platform.openai.com/usage
   - Google Cloud: https://console.cloud.google.com/billing
   - Supabase: Free tier is generous
   - Railway: ~$5/month
   - Vercel: Free for your usage

2. **Monitor Errors:**
   - Railway logs: Click your project → "Logs"
   - Vercel logs: Click your project → "Functions" → "Logs"

## Troubleshooting Common Issues

### "Cannot connect to backend"
- Check Railway is deployed (green check)
- Verify VITE_API_URL in Vercel matches Railway URL
- Check FRONTEND_URL in Railway matches Vercel URL

### "Google search not working"
- Verify Google Search API is enabled
- Check API key restrictions
- Make sure Search Engine ID is correct

### "Payments not working"
- Ensure webhook URL is exact
- Check Stripe webhook secret is updated
- Verify products/prices exist in Stripe

### "Database errors"
- Check Supabase isn't paused (free tier pauses after 1 week inactive)
- Verify DATABASE_URL password is correct
- Run schema.sql again if needed

---

# 🚀 Next Steps

1. **Customize Your Site:**
   - Change colors in Tailwind
   - Update homepage content
   - Add your logo

2. **Monitor Usage:**
   - Set up cost alerts
   - Watch user signups
   - Track which questions people ask

3. **Improve:**
   - Add more trusted domains
   - Tune confidence algorithm
   - Add new features

---

# 🆘 Need Help?

If you get stuck:

1. **Check Logs:**
   - Railway: Your project → "Logs"
   - Vercel: Your project → "Functions" → "Logs"
   - Browser: Right-click → "Inspect" → "Console"

2. **Common Fixes:**
   - Redeploy: Often fixes random issues
   - Check all URLs have https:// (not http://)
   - Verify all API keys are correct
   - Make sure no spaces in API keys

3. **Still Stuck?**
   - Take a screenshot of the error
   - Note which step you're on
   - Check if services are online

Remember: Every developer googles error messages. It's normal to hit snags - just work through them one by one!

---

**You did it! Your AI app is live on the internet! 🎊**
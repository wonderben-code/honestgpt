import express from 'express';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'payment-routes' },
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Tier configuration
const TIER_CONFIG = {
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    name: 'Researcher',
    queries: 200,
  },
  team: {
    priceId: process.env.STRIPE_PRICE_ID_TEAM,
    name: 'Truth Seeker',
    queries: 1000,
  },
};

/**
 * Create checkout session for subscription
 */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;
    
    if (!['pro', 'team'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier selected' });
    }
    
    const tierConfig = TIER_CONFIG[tier];
    
    // Get or create Stripe customer
    let customerId = req.user.stripeCustomerId;
    
    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: userId,
        },
      });
      
      customerId = customer.id;
      
      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: userId,
        tier: tier,
      },
    });
    
    logger.info('Checkout session created', { 
      userId, 
      tier, 
      sessionId: session.id 
    });
    
    res.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
    
  } catch (error) {
    logger.error('Create checkout session error', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to create checkout session' 
    });
  }
});

/**
 * Create customer portal session for managing subscription
 */
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.stripeCustomerId;
    
    if (!customerId) {
      return res.status(400).json({ 
        error: 'No active subscription found' 
      });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });
    
    res.json({
      url: session.url,
    });
    
  } catch (error) {
    logger.error('Create portal session error', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to create portal session' 
    });
  }
});

/**
 * Get current subscription details
 */
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with subscription info
    const { data: user, error } = await supabase
      .from('users')
      .select('tier, stripe_subscription_id, usage_limit, usage_count, usage_reset_date')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If user has Stripe subscription, get details
    let subscription = null;
    if (user.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(
          user.stripe_subscription_id
        );
      } catch (stripeError) {
        logger.warn('Failed to retrieve Stripe subscription', { 
          error: stripeError.message 
        });
      }
    }
    
    res.json({
      tier: user.tier,
      usageLimit: user.usage_limit,
      usageCount: user.usage_count,
      usageResetDate: user.usage_reset_date,
      subscription: subscription ? {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : null,
    });
    
  } catch (error) {
    logger.error('Get subscription error', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to get subscription details' 
    });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's subscription ID
    const { data: user, error } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();
    
    if (error || !user?.stripe_subscription_id) {
      return res.status(400).json({ 
        error: 'No active subscription found' 
      });
    }
    
    // Cancel at period end (don't immediately terminate)
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      { cancel_at_period_end: true }
    );
    
    logger.info('Subscription cancelled', { 
      userId, 
      subscriptionId: subscription.id 
    });
    
    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      cancelAt: new Date(subscription.cancel_at * 1000),
    });
    
  } catch (error) {
    logger.error('Cancel subscription error', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to cancel subscription' 
    });
  }
});

/**
 * Webhook handler for Stripe events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }
    
    res.json({ received: true });
    
  } catch (error) {
    logger.error('Webhook processing error', { 
      error: error.message,
      eventType: event.type 
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId;
  const tier = session.metadata.tier;
  const subscriptionId = session.subscription;
  
  // Update user tier and subscription
  const tierConfig = TIER_CONFIG[tier];
  
  await supabase
    .from('users')
    .update({
      tier: tier,
      stripe_subscription_id: subscriptionId,
      usage_limit: tierConfig.queries,
      usage_count: 0,
      usage_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  // Record subscription history
  await supabase
    .from('subscription_history')
    .insert({
      user_id: userId,
      tier: tier,
      stripe_subscription_id: subscriptionId,
      started_at: new Date().toISOString(),
      status: 'active',
    });
  
  logger.info('Checkout completed', { userId, tier, subscriptionId });
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;
  
  // Find user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id, tier')
    .eq('stripe_customer_id', customerId)
    .single();
  
  if (!user) {
    logger.warn('User not found for subscription update', { customerId });
    return;
  }
  
  // Determine tier from price ID
  let newTier = 'free';
  let usageLimit = 10;
  
  if (subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;
    
    for (const [tier, config] of Object.entries(TIER_CONFIG)) {
      if (config.priceId === priceId) {
        newTier = tier;
        usageLimit = config.queries;
        break;
      }
    }
  }
  
  // Update user tier if changed
  if (user.tier !== newTier) {
    await supabase
      .from('users')
      .update({
        tier: newTier,
        usage_limit: usageLimit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    logger.info('User tier updated', { 
      userId: user.id, 
      oldTier: user.tier, 
      newTier 
    });
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  
  // Find user and downgrade to free tier
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  
  if (user) {
    await supabase
      .from('users')
      .update({
        tier: 'free',
        usage_limit: 10,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    // Update subscription history
    await supabase
      .from('subscription_history')
      .update({
        ended_at: new Date().toISOString(),
        status: 'cancelled',
      })
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscription.id);
    
    logger.info('User downgraded to free tier', { userId: user.id });
  }
}

/**
 * Handle failed payments
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  
  // Log the failure
  logger.warn('Payment failed', { 
    customerId, 
    amount: invoice.amount_due,
    attemptCount: invoice.attempt_count 
  });
  
  // TODO: Send email notification to user
}

export default router;
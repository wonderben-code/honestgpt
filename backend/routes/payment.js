const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authMiddleware } = require('../middleware/auth');
const { pool } = require('../db/config');

// Create checkout session
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const { priceId, tierName } = req.body;
  const userId = req.user.id;

  try {
    // Validate tier name
    if (!['trial', 'pro', 'ultra'].includes(tierName)) {
      return res.status(400).json({ error: 'Invalid tier selected' });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = req.user.stripe_customer_id;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: userId.toString()
        }
      });
      stripeCustomerId = customer.id;
      
      // Save Stripe customer ID
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [stripeCustomerId, userId]
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: tierName === 'trial' ? 'payment' : 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: userId.toString(),
        tierName: tierName
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Get the user ID and tier from metadata
        const userId = parseInt(session.metadata.userId);
        const tierName = session.metadata.tierName;
        const customerId = session.customer;
        
        // Update user tier
        await updateUserTier(userId, tierName, customerId);
        
        console.log(`User ${userId} upgraded to ${tierName} tier`);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        
        // Find user by Stripe customer ID
        const userResult = await pool.query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [subscription.customer]
        );
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          
          // Determine tier based on price ID
          let tier = null;
          if (subscription.items.data[0].price.id === process.env.STRIPE_PRICE_ID_PRO) {
            tier = 'pro';
          } else if (subscription.items.data[0].price.id === process.env.STRIPE_PRICE_ID_ULTRA) {
            tier = 'ultra';
          }
          
          if (tier && subscription.status === 'active') {
            await updateUserTier(user.id, tier);
            console.log(`Subscription updated for user ${user.id} to ${tier}`);
          }
        }
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        
        // Find user and remove their tier
        const cancelUserResult = await pool.query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [canceledSubscription.customer]
        );
        
        if (cancelUserResult.rows.length > 0) {
          const user = cancelUserResult.rows[0];
          await pool.query(
            'UPDATE users SET tier = NULL, queries_limit = 0, updated_at = NOW() WHERE id = $1',
            [user.id]
          );
          console.log(`Subscription canceled for user ${user.id}`);
        }
        break;

      case 'invoice.payment_succeeded':
        // Reset monthly query usage
        const invoice = event.data.object;
        const invoiceUserResult = await pool.query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [invoice.customer]
        );
        
        if (invoiceUserResult.rows.length > 0) {
          const user = invoiceUserResult.rows[0];
          await pool.query(
            'UPDATE users SET queries_used = 0, updated_at = NOW() WHERE id = $1',
            [user.id]
          );
          console.log(`Query usage reset for user ${user.id}`);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.error(`Payment failed for customer ${failedInvoice.customer}`);
        // You might want to send an email or notification here
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Get subscription details
router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.stripe_customer_id || !user.tier) {
      return res.json({
        hasSubscription: false,
        tier: null,
        queriesUsed: user.queries_used || 0,
        queriesLimit: user.queries_limit || 0
      });
    }

    // Get subscription details from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    let subscriptionDetails = null;
    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      subscriptionDetails = {
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end
      };
    }

    res.json({
      hasSubscription: true,
      tier: user.tier,
      queriesUsed: user.queries_used,
      queriesLimit: user.queries_limit,
      subscription: subscriptionDetails
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription details' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authMiddleware, async (req, res) => {
  try {
    if (!req.user.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: req.user.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      subscriptions.data[0].id,
      { cancel_at_period_end: true }
    );

    res.json({
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: new Date(subscription.cancel_at * 1000)
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Helper function to update user tier
async function updateUserTier(userId, tier, stripeCustomerId = null) {
  try {
    let queries_limit;
    
    switch(tier) {
      case 'trial':
        queries_limit = 20;
        break;
      case 'pro':
        queries_limit = 200;
        break;
      case 'ultra':
        queries_limit = 1000;
        break;
      default:
        queries_limit = 0;
    }

    const query = stripeCustomerId 
      ? `UPDATE users 
         SET tier = $1, queries_limit = $2, stripe_customer_id = $3, queries_used = 0, updated_at = NOW() 
         WHERE id = $4 
         RETURNING id, email, name, tier, queries_limit`
      : `UPDATE users 
         SET tier = $1, queries_limit = $2, queries_used = 0, updated_at = NOW() 
         WHERE id = $3 
         RETURNING id, email, name, tier, queries_limit`;

    const params = stripeCustomerId 
      ? [tier, queries_limit, stripeCustomerId, userId]
      : [tier, queries_limit, userId];

    const result = await pool.query(query, params);

    // Log the tier change
    await pool.query(
      'INSERT INTO payments (user_id, amount, currency, status, tier, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [userId, 0, 'usd', 'completed', tier]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating user tier:', error);
    throw error;
  }
}

module.exports = router;
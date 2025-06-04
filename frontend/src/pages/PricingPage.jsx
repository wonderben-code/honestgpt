import React from 'react';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const tiers = [
    {
      name: 'Trial',
      price: '$1',
      period: 'one-time',
      description: 'Perfect for trying out honestGPT',
      features: [
        '20 AI queries',
        'Web search integration',
        'Confidence scores',
        'Source citations',
        'Basic support',
        'Valid for 7 days'
      ],
      notIncluded: [
        'Priority support',
        'API access',
        'Custom domains'
      ],
      cta: 'Start Trial',
      priceId: process.env.VITE_STRIPE_PRICE_ID_TRIAL,
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'For professionals and researchers',
      features: [
        '200 AI queries per month',
        'Web search integration',
        'Confidence scores',
        'Source citations',
        'Priority support',
        'Export conversations',
        'Advanced analytics'
      ],
      notIncluded: [
        'API access',
        'Custom domains'
      ],
      cta: 'Go Pro',
      priceId: process.env.VITE_STRIPE_PRICE_ID_PRO,
      highlighted: true
    },
    {
      name: 'Ultra',
      price: '$99',
      period: 'per month',
      description: 'For teams and organizations',
      features: [
        '1000 AI queries per month',
        'Web search integration',
        'Confidence scores',
        'Source citations',
        'Priority support',
        'Export conversations',
        'Advanced analytics',
        'API access',
        'Custom domains',
        'Team collaboration',
        'SSO integration'
      ],
      notIncluded: [],
      cta: 'Go Ultra',
      priceId: process.env.VITE_STRIPE_PRICE_ID_ULTRA,
      highlighted: false
    }
  ];

  const handleSelectTier = async (tier) => {
    if (!user) {
      // Store selected tier and redirect to signup
      localStorage.setItem('selectedTier', JSON.stringify({
        name: tier.name,
        priceId: tier.priceId
      }));
      navigate('/signup');
      return;
    }

    // If user is logged in, proceed to checkout
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          priceId: tier.priceId,
          tierName: tier.name.toLowerCase()
        })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Transparent AI assistance with confidence scores and real sources
          </p>
        </div>

        <div className="mt-16 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl shadow-lg ${
                tier.highlighted
                  ? 'border-2 border-indigo-600 transform scale-105'
                  : 'border border-gray-200'
              } bg-white p-8`}
            >
              {tier.highlighted && (
                <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-600 text-white">
                  Most Popular
                </span>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{tier.description}</p>
                <p className="mt-4">
                  <span className="text-5xl font-extrabold text-gray-900">{tier.price}</span>
                  <span className="text-lg font-medium text-gray-500">/{tier.period}</span>
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="ml-3 text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
                {tier.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <X className="flex-shrink-0 h-5 w-5 text-gray-400" />
                    <span className="ml-3 text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectTier(tier)}
                className={`mt-8 w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  tier.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            All plans include secure payment processing via Stripe.
            Cancel or change your plan anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
import React, { useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { paymentAPI } from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState('');

  const tiers = [
    {
      id: 'free',
      name: 'Curious',
      price: 0,
      description: 'Perfect for trying out honestGPT',
      features: [
        '10 queries per month',
        'Basic confidence scores',
        '3 sources per response',
        'Community support',
      ],
      notIncluded: [
        'Advanced confidence breakdowns',
        'Export conversations',
        'API access',
        'Priority support',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Researcher',
      price: 19,
      description: 'For serious research and fact-checking',
      features: [
        '200 queries per month',
        'Advanced confidence breakdowns',
        '10 sources per response',
        'Export conversations (JSON/Markdown)',
        'Priority support',
        'Source quality filtering',
      ],
      notIncluded: [
        'API access',
        'Custom trusted domains',
        'Team collaboration',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      id: 'team',
      name: 'Truth Seeker',
      price: 99,
      description: 'For teams and power users',
      features: [
        '1,000 queries per month',
        'Everything in Pro',
        'API access for automation',
        'Custom trusted domains',
        'Team collaboration tools',
        'Dedicated support',
        'Usage analytics',
        'SSO authentication',
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const handleSelectTier = async (tier) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    if (tier.id === 'free') {
      if (user?.tier === 'free') {
        toast.success('You are already on the free tier');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    if (tier.id === 'team') {
      // For team tier, redirect to contact form or email
      window.location.href = 'mailto:sales@honestgpt.com?subject=Team Plan Inquiry';
      return;
    }

    // Handle paid tier checkout
    setIsLoading(tier.id);
    try {
      const { sessionUrl } = await paymentAPI.createCheckoutSession(tier.id);
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Start free, upgrade when you need more searches
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white rounded-lg shadow-lg p-8 ${
                tier.popular ? 'ring-2 ring-purple-600' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 mb-4">{tier.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${tier.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                    <span className="ml-3 text-gray-700">{feature}</span>
                  </li>
                ))}
                {tier.notIncluded.map((feature, index) => (
                  <li key={index} className="flex items-start opacity-50">
                    <X className="text-gray-400 flex-shrink-0 mt-0.5" size={20} />
                    <span className="ml-3 text-gray-500 line-through">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectTier(tier)}
                disabled={isLoading === tier.id}
                className={`w-full py-3 px-6 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  tier.popular
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading === tier.id ? (
                  <LoadingSpinner size="small" color={tier.popular ? 'white' : 'gray'} />
                ) : (
                  <>
                    {tier.cta}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <FAQItem
              question="How do queries work?"
              answer="Each search you make counts as one query. This includes the web search, confidence analysis, and AI response generation. Your monthly quota resets on the same day each month."
            />
            <FAQItem
              question="Can I change plans anytime?"
              answer="Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged a prorated amount. When downgrading, the change takes effect at the next billing cycle."
            />
            <FAQItem
              question="What sources does honestGPT search?"
              answer="We prioritize trusted sources including government sites (.gov), educational institutions (.edu), peer-reviewed journals, and reputable news organizations. You can see the exact sources for each response."
            />
            <FAQItem
              question="How is this different from ChatGPT Plus?"
              answer="ChatGPT can't search the web, doesn't cite sources, and always sounds confident even when wrong. honestGPT searches trusted sources in real-time, provides citations, and shows you exactly how confident it is based on evidence quality."
            />
            <FAQItem
              question="Is there an API?"
              answer="Yes! The Truth Seeker (Team) tier includes API access so you can integrate honestGPT into your own applications and workflows."
            />
            <FAQItem
              question="What happens if I exceed my query limit?"
              answer="You'll see a notification that you've reached your monthly limit. You can either wait for the next billing cycle or upgrade to a higher tier for immediate access."
            />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@honestgpt.com"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Contact our team →
          </a>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 pb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex justify-between items-center"
      >
        <h3 className="text-lg font-medium text-gray-900">{question}</h3>
        <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <p className="mt-4 text-gray-600">{answer}</p>
      )}
    </div>
  );
}
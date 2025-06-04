import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff, Check } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [step, setStep] = useState(1); // 1: Account info, 2: Choose plan

  useEffect(() => {
    // Check if user came from pricing page with a selected tier
    const savedTier = localStorage.getItem('selectedTier');
    if (savedTier) {
      const tier = JSON.parse(savedTier);
      setSelectedTier(tier);
      localStorage.removeItem('selectedTier');
    }
    clearError();
  }, [clearError]);

  const tiers = [
    {
      name: 'Trial',
      price: '$1',
      period: 'one-time',
      queries: '20 queries',
      priceId: process.env.VITE_STRIPE_PRICE_ID_TRIAL
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      queries: '200 queries/month',
      priceId: process.env.VITE_STRIPE_PRICE_ID_PRO,
      recommended: true
    },
    {
      name: 'Ultra',
      price: '$99',
      period: 'per month',
      queries: '1000 queries/month',
      priceId: process.env.VITE_STRIPE_PRICE_ID_ULTRA
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Move to tier selection if not already selected
    if (!selectedTier) {
      setStep(2);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    try {
      // Register the user
      const userData = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      if (userData && userData.user) {
        // Store auth token if provided
        if (userData.token) {
          localStorage.setItem('token', userData.token);
        }

        // Proceed to checkout
        const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token || localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            priceId: selectedTier.priceId,
            tierName: selectedTier.name.toLowerCase()
          })
        });

        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error('No checkout URL received');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  if (step === 2 && !selectedTier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Choose Your Plan
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Select the plan that best fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
                  tier.recommended
                    ? 'border-indigo-600 transform scale-105 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedTier(tier);
                  handleFinalSubmit();
                }}
              >
                {tier.recommended && (
                  <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
                    Recommended
                  </span>
                )}
                
                <h3 className="text-lg font-medium text-gray-900">{tier.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-sm text-gray-500">/{tier.period}</span>
                </p>
                <p className="mt-2 text-sm text-gray-500">{tier.queries}</p>
                
                <button
                  className={`mt-4 w-full py-2 px-4 rounded-md font-medium ${
                    tier.recommended
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Select {tier.name}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to account details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {selectedTier ? (
              <span className="font-medium text-indigo-600">
                Selected plan: {selectedTier.name} - {selectedTier.price}/{selectedTier.period}
              </span>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleAccountSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : selectedTier ? 'Continue to payment' : 'Choose plan'}
            </button>
          </div>

          <div className="text-xs text-center text-gray-600">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-indigo-600 hover:text-indigo-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500">
              Privacy Policy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
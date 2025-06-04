// frontend/src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import apiService from '../services/api';
import { toast } from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh user data to get updated tier
        await verifyAuth();
        
        // Get subscription details
        const subscription = await apiService.getSubscription();
        
        if (subscription.hasSubscription) {
          setVerified(true);
          toast.success(`Welcome to honestGPT ${subscription.tier}!`);
        } else {
          // Webhook might still be processing
          toast.loading('Finalizing your subscription...');
          
          // Try again after a delay
          setTimeout(async () => {
            await verifyAuth();
            const retrySubscription = await apiService.getSubscription();
            if (retrySubscription.hasSubscription) {
              setVerified(true);
              toast.success(`Welcome to honestGPT ${retrySubscription.tier}!`);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast.error('Unable to verify payment. Please contact support if the issue persists.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [sessionId, verifyAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Verifying your payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            {verified 
              ? "Your subscription is now active. You can start using honestGPT right away!"
              : "Your payment has been processed. Your subscription will be activated shortly."}
          </p>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/chat')}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Chatting
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            
            <button
              onClick={() => navigate('/billing')}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Billing Details
            </button>
          </div>

          {sessionId && (
            <p className="mt-6 text-sm text-gray-500">
              Order ID: {sessionId}
            </p>
          )}
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What's Next?
          </h3>
          <div className="space-y-3 text-left max-w-sm mx-auto">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Ask any question and get transparent, sourced answers
              </p>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                See confidence scores for every response
              </p>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Access your conversation history anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
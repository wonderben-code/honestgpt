// frontend/src/pages/PaymentCancel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, MessageCircle, Mail } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your payment was not completed. No charges have been made to your account.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/pricing')}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Pricing
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Home
            </button>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Need Help?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            If you experienced any issues during checkout or have questions about our plans, we're here to help.
          </p>
          
          <div className="space-y-3">
            <a
              href="/contact"
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </a>
            <a
              href="mailto:support@honestgpt.com"
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              <Mail className="h-4 w-4 mr-2" />
              support@honestgpt.com
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Why Choose honestGPT?
          </h3>
          <div className="space-y-3 text-left max-w-sm mx-auto">
            <div className="flex items-start">
              <div className="h-2 w-2 bg-indigo-600 rounded-full mt-1.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Real-time web search for current information
              </p>
            </div>
            <div className="flex items-start">
              <div className="h-2 w-2 bg-indigo-600 rounded-full mt-1.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Confidence scores on every response
              </p>
            </div>
            <div className="flex items-start">
              <div className="h-2 w-2 bg-indigo-600 rounded-full mt-1.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Verifiable sources for transparency
              </p>
            </div>
            <div className="flex items-start">
              <div className="h-2 w-2 bg-indigo-600 rounded-full mt-1.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                No hidden costs, cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
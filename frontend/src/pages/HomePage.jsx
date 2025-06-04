import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Search, Brain, BarChart3, CheckCircle, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: 'Real-time Web Search',
      description: 'Every response backed by current information from trusted sources including .gov, .edu, and peer-reviewed journals.'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Confidence Scoring',
      description: 'Transparent 0-100% confidence scores based on source quality, consensus, and data recency.'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Verified Citations',
      description: 'Every claim linked to verifiable sources with quality ratings you can trust.'
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: 'Honest Uncertainty',
      description: 'When evidence is weak or conflicting, we tell you "I don\'t know" instead of guessing.'
    }
  ];

  const stats = [
    { value: '95%', label: 'Source Accuracy' },
    { value: '0.8s', label: 'Avg Response Time' },
    { value: '50+', label: 'Trusted Domains' },
    { value: '24/7', label: 'Availability' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 opacity-70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            AI That Admits When It
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Doesn't Know</span>
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Experience transparent AI assistance with confidence scores, real-time web search, and verifiable sources for every response.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/chat"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Go to Chat
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  View Pricing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Starting at just $1 • No hidden fees • Cancel anytime
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose honestGPT?</h2>
          <p className="mt-4 text-lg text-gray-600">
            Built for researchers, professionals, and anyone who values accuracy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-100 text-indigo-600">
                  {feature.icon}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple, transparent, and reliable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-600 text-white mx-auto">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Ask Your Question</h3>
              <p className="mt-2 text-gray-600">
                Type any question just like you would with ChatGPT
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-600 text-white mx-auto">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">We Search & Analyze</h3>
              <p className="mt-2 text-gray-600">
                Real-time search across trusted sources with quality scoring
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-600 text-white mx-auto">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Get Transparent Results</h3>
              <p className="mt-2 text-gray-600">
                Receive answers with confidence scores and verifiable citations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready for AI You Can Trust?
          </h2>
          <p className="mt-4 text-xl text-indigo-200">
            Join thousands who've switched to transparent AI
          </p>
          <div className="mt-8">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-600 bg-white hover:bg-gray-100 transition-colors"
            >
              View Plans & Pricing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">honestGPT</h3>
              <p className="text-sm">
                Transparent AI assistance with real sources and confidence scores.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link to="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
            <p>&copy; 2024 honestGPT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Search, Brain, BarChart3, CheckCircle, Zap, Star, Globe, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isVisible, setIsVisible] = useState({});

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Search className="h-6 w-6 text-white" />,
      title: 'Real-time Web Search',
      description: 'Every response backed by current information from trusted sources including .gov, .edu, and peer-reviewed journals.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      title: 'Confidence Scoring',
      description: 'Transparent 0-100% confidence scores based on source quality, consensus, and data recency.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Shield className="h-6 w-6 text-white" />,
      title: 'Verified Citations',
      description: 'Every claim linked to verifiable sources with quality ratings you can trust.',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      icon: <Brain className="h-6 w-6 text-white" />,
      title: 'Honest Uncertainty',
      description: 'When evidence is weak or conflicting, we tell you "I don\'t know" instead of guessing.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: <Zap className="h-6 w-6 text-white" />,
      title: 'Lightning Fast',
      description: 'Get comprehensive, sourced answers in seconds, not minutes.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Lock className="h-6 w-6 text-white" />,
      title: 'Privacy First',
      description: 'Your queries and data are encrypted and never used for training.',
      gradient: 'from-indigo-500 to-purple-500'
    }
  ];

  const stats = [
    { value: '95%', label: 'Source Accuracy', color: 'text-green-600' },
    { value: '0.8s', label: 'Avg Response Time', color: 'text-blue-600' },
    { value: '50+', label: 'Trusted Domains', color: 'text-purple-600' },
    { value: '24/7', label: 'Availability', color: 'text-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6" 
                  style={{ animation: 'fadeInUp 0.8s ease' }}>
                <span className="text-gray-900">AI That Admits</span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent animated-gradient-text">
                  When It Doesn't Know
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed"
                 style={{ animation: 'fadeInUp 0.8s ease 0.2s both' }}>
                Experience transparent AI assistance with real-time web search, confidence scores, and verifiable sources for every response.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                   style={{ animation: 'fadeInUp 0.8s ease 0.4s both' }}>
                {user ? (
                  <Link
                    to="/chat"
                    className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl btn-glow"
                  >
                    Go to Chat
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/pricing"
                      className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl btn-glow"
                    >
                      View Pricing
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full text-purple-600 bg-white border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>

              <p className="mt-6 text-sm text-gray-500">
                Starting at just $1 • No credit card required • Cancel anytime
              </p>
            </div>

            {/* Sample Query Card */}
            <div className="relative" style={{ animation: 'fadeInRight 0.8s ease 0.6s both' }}>
              <div className="glass rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                {/* User Query */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl rounded-br-none mb-4">
                  <p className="font-medium">"What are the latest developments in quantum computing?"</p>
                </div>

                {/* AI Response */}
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                  {/* Confidence Meter */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                        <circle cx="32" cy="32" r="28" stroke="#10b981" strokeWidth="4" fill="none"
                                strokeDasharray="176" strokeDashoffset="17.6"
                                className="transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-green-600">90%</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-green-600">High Confidence</p>
                      <p className="text-sm text-gray-600">Based on 12 trusted sources</p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Recent breakthroughs include IBM's 433-qubit Osprey processor and Google's demonstration of quantum error correction...
                  </p>

                  {/* Source Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      nature.com
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      arxiv.org
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      ibm.com
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      +9 more
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg transform rotate-12 animate-pulse">
                <Star className="h-4 w-4 inline mr-1" />
                <span className="text-sm font-bold">Live Demo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} 
                   id={`stat-${index}`}
                   className="text-center animate-on-scroll"
                   style={isVisible[`stat-${index}`] ? { animation: 'fadeInUp 0.8s ease both' } : { opacity: 0 }}>
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Bento Grid */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Truth Seekers
            </h2>
            <p className="text-xl text-gray-600">
              Every feature designed to give you confidence in AI responses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                id={`feature-${index}`}
                className="animate-on-scroll"
                style={isVisible[`feature-${index}`] ? { 
                  animation: `fadeInUp 0.8s ease ${index * 0.1}s both` 
                } : { opacity: 0 }}
              >
                <div className="h-full glass rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 card-hover">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 transform skew-y-3"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready for AI You Can Trust?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands who've switched to transparent AI
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full text-purple-600 bg-white hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
          >
            View Plans & Pricing
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                honestGPT
              </h3>
              <p className="text-sm">
                Transparent AI assistance with real sources and confidence scores.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
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
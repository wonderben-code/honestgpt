import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  CreditCard,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { userAPI, paymentAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [usageStats, setUsageStats] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load usage stats and subscription info in parallel
      const [usageResponse, subscriptionResponse] = await Promise.all([
        userAPI.getUsageStats(),
        paymentAPI.getSubscription(),
      ]);
      
      setUsageStats(usageResponse.usage);
      setSubscription(subscriptionResponse);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { url } = await paymentAPI.createPortalSession();
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to open subscription management');
      setIsManagingSubscription(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const usagePercentage = usageStats?.current 
    ? (usageStats.current.used / usageStats.current.limit) * 100 
    : 0;

  const daysUntilReset = usageStats?.current?.resetDate 
    ? Math.ceil((new Date(usageStats.current.resetDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 30;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name || user?.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Usage Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="text-purple-600" size={24} />
              <span className="text-sm text-gray-500">This Month</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                {usageStats?.current?.used || 0} / {usageStats?.current?.limit || 10}
              </h3>
              <p className="text-sm text-gray-600">Queries Used</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    usagePercentage >= 80 ? 'bg-red-500' : 
                    usagePercentage >= 60 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tier Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="text-purple-600" size={24} />
              <span className={`text-xs px-2 py-1 rounded-full ${
                user?.tier === 'team' ? 'bg-purple-100 text-purple-700' :
                user?.tier === 'pro' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {user?.tier?.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-semibold capitalize">
              {user?.tier === 'free' ? 'Curious' :
               user?.tier === 'pro' ? 'Researcher' :
               'Truth Seeker'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Current Plan</p>
            {user?.tier === 'free' && (
              <Link 
                to="/pricing" 
                className="text-purple-600 hover:text-purple-700 text-sm mt-2 inline-flex items-center gap-1"
              >
                Upgrade <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* Reset Date Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-purple-600" size={24} />
              <RefreshCw className="text-gray-400" size={16} />
            </div>
            <h3 className="text-2xl font-bold">{daysUntilReset}</h3>
            <p className="text-sm text-gray-600">Days until reset</p>
            <p className="text-xs text-gray-500 mt-2">
              {usageStats?.current?.resetDate && 
                format(new Date(usageStats.current.resetDate), 'MMM d, yyyy')
              }
            </p>
          </div>

          {/* Total Queries Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-purple-600" size={24} />
              <span className="text-sm text-gray-500">All Time</span>
            </div>
            <h3 className="text-2xl font-bold">
              {usageStats?.history?.totalQueries || 0}
            </h3>
            <p className="text-sm text-gray-600">Total Queries</p>
            <p className="text-xs text-gray-500 mt-2">
              ${usageStats?.history?.totalCost?.toFixed(2) || '0.00'} estimated cost
            </p>
          </div>
        </div>

        {/* Subscription Section */}
        {user?.tier !== 'free' && subscription && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">
                  <span className={`inline-flex items-center gap-2 ${
                    subscription.subscription?.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {subscription.subscription?.status || 'Active'}
                    {subscription.subscription?.cancelAtPeriodEnd && (
                      <span className="text-yellow-600 text-xs">(Canceling)</span>
                    )}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Next Billing Date</p>
                <p className="font-medium">
                  {subscription.subscription?.currentPeriodEnd 
                    ? format(new Date(subscription.subscription.currentPeriodEnd), 'MMMM d, yyyy')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleManageSubscription}
                disabled={isManagingSubscription}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                {isManagingSubscription ? (
                  <LoadingSpinner size="small" color="gray" />
                ) : (
                  'Manage Subscription'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Usage History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Usage History</h2>
          
          {usageStats?.history?.byDay && Object.keys(usageStats.history.byDay).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(usageStats.history.byDay)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .slice(0, 7)
                .map(([date, data]) => (
                  <div key={date} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">
                        {format(new Date(date), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(date), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{data.count} queries</p>
                      <p className="text-sm text-gray-600">${data.cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
              <p>No usage history yet</p>
              <Link 
                to="/chat" 
                className="text-purple-600 hover:text-purple-700 mt-2 inline-flex items-center gap-1"
              >
                Start chatting <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link
            to="/chat"
            className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold">New Chat</h3>
              <p className="text-purple-100 text-sm mt-1">Start a conversation</p>
            </div>
            <MessageSquare size={24} />
          </Link>
          
          <Link
            to="/settings"
            className="bg-gray-100 text-gray-700 rounded-lg p-6 hover:bg-gray-200 transition flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold">Settings</h3>
              <p className="text-gray-600 text-sm mt-1">Manage your account</p>
            </div>
            <ArrowRight size={24} />
          </Link>
          
          {user?.tier === 'free' && (
            <Link
              to="/pricing"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6 hover:opacity-90 transition flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold">Upgrade Plan</h3>
                <p className="text-purple-100 text-sm mt-1">Get more queries</p>
              </div>
              <TrendingUp size={24} />
            </Link>
          )}
        </div>

        {/* Low usage warning */}
        {usagePercentage >= 80 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-medium text-yellow-900">
                You're running low on queries
              </h4>
              <p className="text-sm text-yellow-800 mt-1">
                You've used {usageStats.current.used} of your {usageStats.current.limit} monthly queries. 
                {user?.tier === 'free' && (
                  <Link to="/pricing" className="ml-1 font-medium underline">
                    Upgrade your plan
                  </Link>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
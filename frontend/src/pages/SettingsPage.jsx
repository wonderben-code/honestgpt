import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Key, Trash2, Copy, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { userAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [referralData, setReferralData] = useState(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // API key form state
  const [apiKeyName, setApiKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState(null);
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  useEffect(() => {
    if (user?.tier === 'team') {
      loadApiKeys();
    }
    loadReferralData();
  }, [user?.tier]);

  const loadApiKeys = async () => {
    try {
      const response = await userAPI.listApiKeys();
      setApiKeys(response.apiKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const loadReferralData = async () => {
    try {
      const response = await userAPI.getReferralStats();
      setReferralData(response);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await userAPI.updateProfile(profileForm);
      updateUser(profileForm);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await userAPI.updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    
    if (!apiKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setIsLoading(true);

    try {
      const response = await userAPI.createApiKey(apiKeyName);
      setNewApiKey(response.apiKey);
      setApiKeyName('');
      loadApiKeys();
      toast.success('API key created successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await userAPI.deleteApiKey(keyId);
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      toast.success('API key deleted');
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text, keyId = null) => {
    navigator.clipboard.writeText(text);
    if (keyId) {
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
    toast.success('Copied to clipboard');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    ...(user?.tier === 'team' ? [{ id: 'api', label: 'API Keys', icon: Key }] : []),
    { id: 'referrals', label: 'Referrals', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-600">
                  <p>Account Type: <span className="font-medium capitalize">{user?.tier}</span></p>
                  <p>Member Since: {new Date(user?.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Change Password'}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t">
              <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
              <p className="text-gray-600 mb-4">
                Deleting your account is permanent and cannot be undone. All your data will be lost.
              </p>
              <button className="text-red-600 hover:text-red-700 font-medium">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && user?.tier === 'team' && (
          <div className="space-y-6">
            {/* Create new key */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Create API Key</h2>
              
              {newApiKey ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Check className="text-green-600 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900">API Key Created</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Save this key securely. It will not be shown again.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <code className="bg-white px-3 py-2 rounded border text-sm flex-1">
                          {newApiKey.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(newApiKey.key)}
                          className="p-2 hover:bg-green-100 rounded transition"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => setNewApiKey(null)}
                        className="text-green-700 hover:text-green-800 text-sm mt-3"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateApiKey} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="API key name (e.g., Production App)"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    maxLength={50}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !apiKeyName.trim()}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    Create Key
                  </button>
                </form>
              )}
            </div>

            {/* List API keys */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Your API Keys</h2>
              
              {apiKeys.length === 0 ? (
                <p className="text-gray-600">No API keys yet. Create one above to get started.</p>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{key.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {key.key_prefix}... • Created {new Date(key.created_at).toLocaleDateString()}
                          {key.last_used && ` • Last used ${new Date(key.last_used).toLocaleDateString()}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteApiKey(key.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && referralData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Referral Program</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Your Referral Code</h3>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-4 py-2 rounded text-lg font-mono">
                    {referralData.referralCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(referralData.referralCode)}
                    className="p-2 hover:bg-gray-100 rounded transition"
                  >
                    {copiedKeyId === 'referral' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Share Your Link</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralData.referralLink}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(referralData.referralLink, 'link')}
                    className="p-2 hover:bg-gray-100 rounded transition"
                  >
                    {copiedKeyId === 'link' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">
                  Total Referrals: {referralData.referralCount}
                </h3>
                <p className="text-sm text-purple-700">
                  Share your referral link with friends and colleagues. When they sign up using your code,
                  both of you get benefits!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
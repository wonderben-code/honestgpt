import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, CreditCard } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">honestGPT</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {user ? (
                <>
                  <Link
                    to="/chat"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/chat')
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    Chat
                  </Link>
                  <Link
                    to="/history"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/history')
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    History
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/features"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/features')
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    Features
                  </Link>
                  <Link
                    to="/pricing"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/pricing')
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/about"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/about')
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    About
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth/User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.tier && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                      {user.tier}
                    </span>
                  )}
                </span>
                <div className="relative group">
                  <button className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                    <User className="h-5 w-5 mr-1" />
                    {user.name || user.email}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="inline h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/billing"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CreditCard className="inline h-4 w-4 mr-2" />
                      Billing
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <Link
                  to="/chat"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/chat')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  to="/history"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/history')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  History
                </Link>
                <Link
                  to="/profile"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/profile')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/billing"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/billing')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Billing
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/features"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/features')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/pricing')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/about')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
                <div className="border-t border-gray-200 pt-2">
                  <Link
                    to="/login"
                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block pl-3 pr-4 py-2 text-base font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
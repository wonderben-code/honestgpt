// frontend/src/components/NavBar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, CreditCard, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'glass shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <Sparkles className="h-6 w-6 text-purple-600 mr-2 group-hover:text-indigo-600 transition-colors" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                honestGPT
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {user ? (
                <>
                  <Link
                    to="/chat"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-300 ${
                      isActive('/chat')
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-700 hover:text-purple-600 relative after:content-[""] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-purple-600 after:to-indigo-600 after:transition-all hover:after:w-full'
                    }`}
                  >
                    Chat
                  </Link>
                  <Link
                    to="/history"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-300 ${
                      isActive('/history')
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-700 hover:text-purple-600 relative after:content-[""] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-purple-600 after:to-indigo-600 after:transition-all hover:after:w-full'
                    }`}
                  >
                    History
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/features"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-300 ${
                      isActive('/features')
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-700 hover:text-purple-600 relative after:content-[""] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-purple-600 after:to-indigo-600 after:transition-all hover:after:w-full'
                    }`}
                  >
                    Features
                  </Link>
                  <Link
                    to="/pricing"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-300 ${
                      isActive('/pricing')
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-700 hover:text-purple-600 relative after:content-[""] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-purple-600 after:to-indigo-600 after:transition-all hover:after:w-full'
                    }`}
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/about"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-300 ${
                      isActive('/about')
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-700 hover:text-purple-600 relative after:content-[""] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-purple-600 after:to-indigo-600 after:transition-all hover:after:w-full'
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
                {user.tier && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 capitalize">
                    {user.tier} Plan
                  </span>
                )}
                <div className="relative group">
                  <button className="flex items-center text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50">
                    <User className="h-5 w-5 mr-2" />
                    {user.name || user.email}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors first:rounded-t-xl"
                    >
                      <User className="inline h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/billing"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <CreditCard className="inline h-4 w-4 mr-2" />
                      Billing
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors last:rounded-b-xl"
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
                  className="text-gray-700 hover:text-purple-600 px-4 py-2 text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg btn-glow"
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
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden glass">
          <div className="pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <Link
                  to="/chat"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/chat')
                      ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  to="/history"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/history')
                      ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  History
                </Link>
                <Link
                  to="/profile"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/profile')
                      ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/billing"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/billing')
                      ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
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
                  className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
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
                      ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/pricing')
                      ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    isActive('/about')
                      ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
                <div className="border-t border-gray-200 pt-2">
                  <Link
                    to="/login"
                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block mx-3 my-2 px-4 py-2 text-base font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center rounded-full hover:from-purple-700 hover:to-indigo-700"
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
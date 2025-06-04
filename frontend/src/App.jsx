// frontend/src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

// Page imports
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import History from './pages/History';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import Billing from './pages/Billing';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  const { verifyAuth, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await verifyAuth();
      } catch (error) {
        // User is not authenticated, that's okay
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [verifyAuth]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          
          <main>
            <ErrorBoundary>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/chat" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/chat" />} />
                <Route path="/pricing" element={<Pricing />} />
                
                {/* Payment routes */}
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancel" element={<PaymentCancel />} />
                
                {/* Protected routes */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute>
                      <Billing />
                    </ProtectedRoute>
                  }
                />
                
                {/* Catch all - 404 */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                        <p className="text-xl text-gray-600 mb-8">Page not found</p>
                        <a
                          href="/"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Go Home
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
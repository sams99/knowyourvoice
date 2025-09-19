import React from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';

export function Header() {
  const { user, signOut, isAuthenticated } = useAuth();
  const { setShowAuthModal } = useAppStore();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Audio Transcriber</h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-gray-700">
                  <User size={16} />
                  <span className="text-sm font-medium">
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={() => {/* Open settings */}}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={handleAuthAction}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleAuthAction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
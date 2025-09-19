import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { AuthModal } from './components/auth/AuthModal';
import { MainWorkflow } from './components/main/MainWorkflow';
import { SimpleHistoryBrowser } from './components/history/SimpleHistoryBrowser';

function App() {
  const { isAuthenticated } = useAuth();
  const { 
    activeTab, 
    showAuthModal,
    setShowAuthModal 
  } = useAppStore();

  const renderTabContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900">Authentication Required</h3>
            <p className="text-gray-600 max-w-md">
              Please sign in to access the audio transcription and AI analysis features.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'main':
        return <MainWorkflow />;

      case 'history':
        return <SimpleHistoryBrowser />;

      default:
        return <MainWorkflow />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>

      <AuthModal />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
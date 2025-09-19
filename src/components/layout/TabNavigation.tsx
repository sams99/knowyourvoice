import React from 'react';
import { Upload, Mic, FileText, Brain, History } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const tabs = [
  { id: 'main', label: 'Main', icon: Upload },
  { id: 'history', label: 'History', icon: History },
] as const;

export function TabNavigation() {
  const { activeTab, setActiveTab, currentAudioFile, currentTranscription } = useAppStore();

  // No tabs are disabled in the simple interface

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
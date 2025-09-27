'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Maximize2, Minimize2, Bot } from 'lucide-react';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatInterface } from './ChatInterface';
import { AppShell } from './AppShell';
import { useConversationStore } from '../store/conversationStore';

type WidgetState = 'minimized' | 'compact' | 'maximized';

export function ChatWidget() {
  const [widgetState, setWidgetState] = useState<WidgetState>('minimized');
  const [isVisible, setIsVisible] = useState(false);
  const { selectedConversationId } = useConversationStore();

  useEffect(() => {
    // Show widget after a brief delay for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleStateChange = (newState: WidgetState) => {
    if (newState === 'minimized') {
      // Smooth close animation
      setWidgetState('minimized');
    } else {
      setWidgetState(newState);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay backdrop for maximized state */}
      {widgetState === 'maximized' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => handleStateChange('compact')}
        />
      )}

      {/* Chat Widget */}
      <div className={`fixed z-50 transition-all duration-300 ease-out ${
        widgetState === 'minimized' 
          ? 'bottom-6 right-6 w-14 h-14'
          : widgetState === 'compact'
          ? 'bottom-6 right-6 w-96 h-[500px]'
          : 'inset-4 w-auto h-auto'
      }`}>
        {widgetState === 'minimized' ? (
          <MinimizedWidget onClick={() => handleStateChange('compact')} />
        ) : widgetState === 'compact' ? (
          <CompactWidget 
            onMinimize={() => handleStateChange('minimized')}
            onMaximize={() => handleStateChange('maximized')}
          />
        ) : (
          <MaximizedWidget 
            onMinimize={() => handleStateChange('compact')}
            onClose={() => handleStateChange('minimized')}
          />
        )}
      </div>
    </>
  );
}

function MinimizedWidget({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group transform hover:scale-110"
    >
      <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
      
      {/* Pulsing indicator for new features */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
    </button>
  );
}

function CompactWidget({ 
  onMinimize, 
  onMaximize 
}: { 
  onMinimize: () => void;
  onMaximize: () => void;
}) {
  return (
    <div className="bg-surface border border-subtle rounded-2xl shadow-custom-lg overflow-hidden h-full flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Nium Copilot</h3>
            <p className="text-xs text-blue-100">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMaximize}
            className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
            title="Expand"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onMinimize}
            className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compact Chat Interface */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface isCompact={true} />
      </div>
    </div>
  );
}

function MaximizedWidget({ 
  onMinimize, 
  onClose 
}: { 
  onMinimize: () => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-surface border border-subtle rounded-2xl shadow-2xl overflow-hidden h-full animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
      {/* Maximized Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Nium Developer Copilot</h2>
            <p className="text-sm text-blue-100">AI-powered assistant for payout integration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Minimize to compact"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Full App Shell */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-subtle">
          <ConversationSidebar />
        </div>
        <div className="flex-1">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
'use client';

import { ReactNode } from 'react';
import { useConversationStore } from '../store/conversationStore';
import { Bot, Settings, HelpCircle } from 'lucide-react';

interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const { selectedConversationId } = useConversationStore();

  return (
    <div className="h-screen flex flex-col bg-subtle">
      {/* Top Navigation Bar */}
      <header className="bg-surface border-b border-subtle px-6 py-4 flex items-center justify-between shadow-custom z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Nium Developer Copilot
            </h1>
            <p className="text-sm text-muted">
              AI-powered assistant for payout integration
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-custom">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-custom">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="flex-shrink-0">
          {sidebar}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
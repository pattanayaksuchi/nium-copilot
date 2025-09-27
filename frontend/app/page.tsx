'use client';

import { ConversationSidebar } from '../src/components/ConversationSidebar';
import { ChatInterface } from '../src/components/ChatInterface';

export default function ConversationApp() {
  return (
    <div className="h-screen flex bg-gray-100">
      <ConversationSidebar />
      <ChatInterface />
    </div>
  );
}
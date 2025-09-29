'use client';

import { ConversationSidebar } from '../../src/components/ConversationSidebar';
import { ChatInterface } from '../../src/components/ChatInterface';
import { AppShell } from '../../src/components/AppShell';

export default function DevCopilotPage() {
  return (
    <AppShell sidebar={<ConversationSidebar />}>
      <ChatInterface />
    </AppShell>
  );
}
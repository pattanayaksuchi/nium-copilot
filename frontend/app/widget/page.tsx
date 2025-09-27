'use client';

import { ChatWidget } from '../../src/components/ChatWidget';

export default function WidgetPage() {
  return (
    <div style={{ 
      width: '100%',
      height: '100%',
      background: 'transparent',
      overflow: 'hidden'
    }}>
      <ChatWidget />
    </div>
  );
}
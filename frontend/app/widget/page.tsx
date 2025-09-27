'use client';

import { ChatWidget } from '../../src/components/ChatWidget';

export default function WidgetPage() {
  return (
    <div style={{ 
      width: '100vw',
      height: '100vh',
      background: 'white',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      padding: '24px'
    }}>
      <ChatWidget />
    </div>
  );
}
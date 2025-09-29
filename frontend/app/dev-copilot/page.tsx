'use client';

import { ConversationSidebar } from '../../src/components/ConversationSidebar';
import { ChatInterface } from '../../src/components/ChatInterface';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function DevCopilotPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden'
    }}>
        {/* Sidebar Container */}
        <div style={{
          width: sidebarCollapsed ? '56px' : '320px',
          flexShrink: 0,
          borderRight: '1px solid #e5e7eb',
          background: '#f9fafb',
          position: 'relative',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '16px 12px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {!sidebarCollapsed && (
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Conversations
              </span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                padding: '6px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Sidebar Content */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {!sidebarCollapsed && <ConversationSidebar />}
          </div>
        </div>

        {/* Chat Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          overflow: 'hidden'
        }}>
          <ChatInterface isCompact={false} />
        </div>
      </div>
  );
}
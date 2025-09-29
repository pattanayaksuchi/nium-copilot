'use client';

import { ConversationSidebar } from '../../src/components/ConversationSidebar';
import { ChatInterface } from '../../src/components/ChatInterface';
import { AppShell } from '../../src/components/AppShell';
import { QueryProvider } from '../../src/components/QueryProvider';
import { ToastProvider } from '../../src/components/Toast';
import { useConversationStore } from '../../src/store/conversationStore';
import { MessageCircle, Minimize2, Maximize2, X, Bot, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WidgetPage() {
  const [widgetState, setWidgetState] = useState<'minimized' | 'compact' | 'maximized'>('minimized');
  const { sidebarCollapsed, setSidebarCollapsed } = useConversationStore();

  useEffect(() => {
    // Notify parent about resize
    const notifyParent = (state: typeof widgetState) => {
      window.parent.postMessage({
        type: 'nium-copilot-resize',
        state: state,
        width: state === 'minimized' ? 56 : state === 'compact' ? 400 : window.innerWidth - 32,
        height: state === 'minimized' ? 56 : state === 'compact' ? 500 : window.innerHeight - 32
      }, window.location.origin);
    };

    notifyParent(widgetState);
  }, [widgetState]);

  if (widgetState === 'minimized') {
    return (
      <div 
        onClick={() => setWidgetState('compact')}
        style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <MessageCircle size={24} />
      </div>
    );
  }

  return (
    <QueryProvider>
      <ToastProvider>
        <div style={{ 
          width: '100%',
          height: '100%',
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Widget Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f9fafb',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={12} color="white" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                Nium Developer Copilot
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              {widgetState === 'compact' && (
                <button
                  onClick={() => setWidgetState('maximized')}
                  style={{
                    padding: '4px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    color: '#6b7280'
                  }}
                >
                  <Maximize2 size={14} />
                </button>
              )}
              {widgetState === 'maximized' && (
                <button
                  onClick={() => setWidgetState('compact')}
                  style={{
                    padding: '4px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    color: '#6b7280'
                  }}
                >
                  <Minimize2 size={14} />
                </button>
              )}
              <button
                onClick={() => setWidgetState('minimized')}
                style={{
                  padding: '4px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  color: '#6b7280'
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Widget Content */}
          <div style={{ 
            flex: 1,
            overflow: 'hidden',
            display: 'flex'
          }}>
            {widgetState === 'maximized' ? (
              // Horizontal layout: sidebar on left, chat on right when maximized
              <div style={{ 
                display: 'flex', 
                width: '100%', 
                height: '100%',
                overflow: 'hidden'
              }}>
                {/* Sidebar Container */}
                <div style={{
                  width: sidebarCollapsed ? '56px' : '280px',
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
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#374151' 
                      }}>
                        Conversations
                      </span>
                    )}
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      style={{
                        padding: '4px',
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
                      {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                  </div>

                  {/* Sidebar Content */}
                  <div style={{
                    flex: 1,
                    overflow: 'hidden',
                    padding: sidebarCollapsed ? '8px' : '12px'
                  }}>
                    {!sidebarCollapsed ? (
                      <ConversationSidebar />
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => {
                            // Create new chat functionality
                          }}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: 'none',
                            background: '#2563eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="New Chat"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
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
            ) : (
              // Clean chat interface only when compact
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                <ChatInterface isCompact={true} />
              </div>
            )}
          </div>
        </div>
      </ToastProvider>
    </QueryProvider>
  );
}
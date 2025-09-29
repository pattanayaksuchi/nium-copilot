'use client';

import { ConversationSidebar } from '../../src/components/ConversationSidebar';
import { ChatInterface } from '../../src/components/ChatInterface';
import { useConversations, useCreateConversation } from '../../src/hooks/useConversations';
import { useToast } from '../../src/components/Toast';
import { AppShell } from '../../src/components/AppShell';
import { QueryProvider } from '../../src/components/QueryProvider';
import { ToastProvider } from '../../src/components/Toast';
import { useConversationStore } from '../../src/store/conversationStore';
import { MessageCircle, Minimize2, Maximize2, X, Bot, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

// Widget-optimized conversation list component
function WidgetConversationList() {
  const { data: conversations = [], isLoading } = useConversations();
  const { selectedConversationId, setSelectedConversationId } = useConversationStore();
  const createConversation = useCreateConversation();
  const { showToast } = useToast();

  const handleNewChat = async () => {
    try {
      const newConversation = await createConversation.mutateAsync(undefined);
      setSelectedConversationId(newConversation.id);
      showToast({
        type: 'success',
        title: 'New conversation created',
        message: 'Ready to start chatting!'
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      showToast({
        type: 'error',
        title: 'Failed to create conversation',
        message: 'Please try again'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      padding: '12px'
    }}>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search conversations..."
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '14px',
          marginBottom: '12px',
          outline: 'none'
        }}
      />

      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        disabled={createConversation.isPending || conversations.length >= 10}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '16px'
        }}
      >
        <Plus size={16} />
        New Chat
      </button>

      {/* Conversations List */}
      <div style={{
        flex: 1,
        overflow: 'auto'
      }}>
        {isLoading ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 16px',
            color: '#6b7280'
          }}>
            <MessageCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500' }}>
              No conversations yet
            </p>
            <p style={{ margin: 0, fontSize: '12px' }}>
              Start a new chat to get started
            </p>
          </div>
        ) : (
          <div>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  backgroundColor: selectedConversationId === conversation.id ? '#eff6ff' : 'transparent',
                  borderLeft: selectedConversationId === conversation.id ? '3px solid #2563eb' : '3px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversationId !== conversation.id) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversationId !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {conversation.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{formatDate(conversation.updated_at)}</span>
                  {conversation.messages_count > 0 && (
                    <>
                      <span>•</span>
                      <span>{conversation.messages_count} messages</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WidgetPage() {
  const [widgetState, setWidgetState] = useState<'minimized' | 'compact' | 'maximized'>('minimized');
  const { sidebarCollapsed, setSidebarCollapsed, setSelectedConversationId } = useConversationStore();
  const createConversation = useCreateConversation();

  const handleNewChatCollapsed = async () => {
    try {
      const newConversation = await createConversation.mutateAsync(undefined);
      setSelectedConversationId(newConversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

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
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {!sidebarCollapsed ? (
                      <WidgetConversationList />
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px'
                      }}>
                        <button
                          onClick={handleNewChatCollapsed}
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
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, Copy, Check, RotateCcw } from 'lucide-react';
import { useConversation, useSendMessage, useCreateConversation } from '../hooks/useConversations';
import { useConversationStore } from '../store/conversationStore';
import { Message, Citation } from '../lib/api';
import { MessageSkeleton } from './LoadingSkeleton';
import { useToast } from './Toast';

interface ChatInterfaceProps {
  isCompact?: boolean;
}

export function ChatInterface({ isCompact = false }: ChatInterfaceProps = {}) {
  const { selectedConversationId, composerText, setComposerText, resetComposer, setSelectedConversationId } = useConversationStore();
  const { data: conversation, isLoading } = useConversation(selectedConversationId);
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const { showToast } = useToast();
  
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleSend = async () => {
    if (!composerText.trim() || sendMessage.isPending || createConversation.isPending) return;
    
    try {
      let conversationId = selectedConversationId;
      
      // If no conversation selected, create one first
      if (!conversationId) {
        const newConversation = await createConversation.mutateAsync('New Chat');
        conversationId = newConversation.id;
        setSelectedConversationId(conversationId);
      }
      
      // Send the message to the conversation
      await sendMessage.mutateAsync({
        conversationId: conversationId,
        content: composerText.trim()
      });
      
      resetComposer();
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast({
        type: 'error',
        title: 'Message failed to send',
        message: 'Please try again'
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      showToast({
        type: 'success',
        title: 'Copied to clipboard',
        message: 'Message content copied'
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast({
        type: 'error',
        title: 'Copy failed',
        message: 'Unable to copy to clipboard'
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!selectedConversationId) {
    return (
      <div className="chat-interface">
        <div className={`chat-welcome ${isCompact ? 'chat-welcome-compact' : ''}`}>
          <div className="chat-welcome-content">
            <div className={`chat-bot-icon ${isCompact ? 'chat-bot-icon-compact' : ''}`}>
              <Bot size={isCompact ? 20 : 28} color="white" />
            </div>
            <h3 className={`chat-welcome-title ${isCompact ? 'chat-welcome-title-compact' : ''}`}>
              {isCompact ? 'Nium Copilot' : 'Welcome to Nium Developer Copilot'}
            </h3>
            <p className={`chat-welcome-description ${isCompact ? 'chat-welcome-description-compact' : ''}`}>
              {isCompact 
                ? 'Ask me about payout integration, validation, or API guidance.'
                : 'Your AI-powered assistant for payout integration. Get instant playbooks, validation guardrails, and docs-aware guidance.'
              }
            </p>
            
            {/* Quick Suggestions */}
            <div className="chat-suggestions">
              <button 
                className="chat-suggestion-btn"
                onClick={() => setComposerText('What are the mandatory fields for USD payouts to the US?')}
              >
                💸 Mandatory fields for USD payouts to the US
              </button>
              <button 
                className="chat-suggestion-btn"
                onClick={() => setComposerText('What is the regexp for Sort code in GBP?')}
              >
                🔗 Regexp for Sort code in GBP
              </button>
              <button 
                className="chat-suggestion-btn"
                onClick={() => setComposerText('What are the proxy types supported in Malaysia?')}
              >
                📋 Proxy types supported in Malaysia
              </button>
              <button 
                className="chat-suggestion-btn"
                onClick={() => setComposerText('Generate a payout object for GBP payouts?')}
              >
                🛠️ Generate payout object for GBP
              </button>
              {!isCompact && (
                <button 
                  className="chat-suggestion-btn"
                  onClick={() => setComposerText('How do I authenticate with Nium API?')}
                >
                  🔐 Authenticate with Nium API
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Always show composer even without conversation */}
        <div className={`chat-composer ${isCompact ? 'chat-composer-compact' : ''}`}>
          <div className={`chat-input-group ${isCompact ? 'chat-input-group-compact' : ''}`}>
            <textarea
              ref={textareaRef}
              value={composerText}
              onChange={(e) => {
                setComposerText(e.target.value);
                // Auto-resize
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, isCompact ? 80 : 120) + 'px';
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={isCompact ? "Ask about payouts..." : "Ask about payout methods, validation requirements, API integration..."}
              className={`chat-input ${isCompact ? 'chat-input-compact' : ''}`}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!composerText.trim() || sendMessage.isPending}
              className={`chat-send-btn ${isCompact ? 'chat-send-btn-compact' : ''}`}
            >
              <Send size={isCompact ? 16 : 20} />
            </button>
          </div>
          {!isCompact && (
            <div className="chat-help-text">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>Powered by Nium AI</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="chat-interface">
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f3f4f6',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{
                height: '16px',
                width: '128px',
                borderRadius: '4px',
                background: '#f3f4f6',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
              <div style={{
                height: '12px',
                width: '96px',
                borderRadius: '4px',
                background: '#f3f4f6',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      {/* Header - Hide in compact mode */}
      {!isCompact && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {conversation?.title || 'New Chat'}
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '4px 0 0 0'
              }}>
                AI-powered assistant for Nium integration teams
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: '#f0fdf4',
                color: '#166534',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '9999px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  background: '#10b981',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                Online
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        <div className={`chat-messages-container ${isCompact ? 'chat-messages-container-compact' : ''}`}>
          {conversation?.messages?.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              onCopy={copyToClipboard}
              copiedMessageId={copiedMessageId}
              isHovered={hoveredMessageId === message.id}
              onHover={() => setHoveredMessageId(message.id)}
              onLeave={() => setHoveredMessageId(null)}
            />
          ))}
          
          {sendMessage.isPending && (
            <div className="message-bubble">
              <div className="message-avatar message-avatar-assistant">
                <Bot size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Composer */}
      <div className={`chat-composer ${isCompact ? 'chat-composer-compact' : ''}`}>
        <div className={isCompact ? '' : 'chat-composer-container'}>
          <div className={`chat-input-group ${isCompact ? 'chat-input-group-compact' : ''}`}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={composerText}
                onChange={(e) => {
                  setComposerText(e.target.value);
                  // Auto-resize
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, isCompact ? 80 : 120) + 'px';
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={isCompact ? "Ask about payouts..." : "Ask about payout methods, validation requirements, API integration..."}
                className={`chat-input ${isCompact ? 'chat-input-compact' : ''}`}
                rows={1}
              />
              {!isCompact && composerText.length > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <span>{composerText.length}/2000</span>
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!composerText.trim() || sendMessage.isPending}
              className={`chat-send-btn ${isCompact ? 'chat-send-btn-compact' : ''}`}
            >
              <Send size={isCompact ? 16 : 20} />
            </button>
          </div>
          {!isCompact && (
            <div className="chat-help-text">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>Powered by Nium AI</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onCopy: (text: string, messageId: string) => void;
  copiedMessageId: string | null;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function MessageBubble({ message, onCopy, copiedMessageId, isHovered, onHover, onLeave }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const timestamp = formatTimestamp(message.created_at);

  return (
    <div 
      className={`message-bubble ${isUser ? 'message-bubble-user' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ position: 'relative' }}
    >
      <div className={`message-avatar ${isUser ? 'message-avatar-user' : 'message-avatar-assistant'}`}>
        {isUser ? (
          <User size={20} color="white" />
        ) : (
          <Bot size={20} color="white" />
        )}
      </div>
      
      <div className={`message-content ${isUser ? 'message-content-user' : ''}`}>
        <div className={`message-header ${isUser ? 'message-header-user' : ''}`}>
          <span className="message-name">
            {isUser ? 'You' : 'Nium Copilot'}
          </span>
          <span className="message-time">{timestamp}</span>
        </div>
        
        <div className={`message-text ${isUser ? 'message-text-user' : ''}`}>
          {message.content}
          
          {/* Hover Actions Toolbar */}
          {isHovered && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: isUser ? 'auto' : '8px',
              left: isUser ? '8px' : 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '4px 8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
              zIndex: 10
            }}>
              <button
                onClick={() => onCopy(message.content, message.id)}
                style={{
                  padding: '4px',
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                title="Copy message"
                onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                {copiedMessageId === message.id ? (
                  <Check size={12} color="#10b981" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
              {!isUser && (
                <button
                  style={{
                    padding: '4px',
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  title="Regenerate response"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div style={{
            marginTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignSelf: isUser ? 'flex-end' : 'flex-start'
          }}>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}>Sources</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {message.citations.map((citation, index) => (
                <CitationChip key={index} citation={citation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CitationCardProps {
  citation: Citation;
}

function CitationChip({ citation }: CitationCardProps) {
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#1d4ed8',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        maxWidth: '128px'
      }}
      title={citation.snippet}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#dbeafe';
        e.currentTarget.style.color = '#1e40af';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#eff6ff';
        e.currentTarget.style.color = '#1d4ed8';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <ExternalLink size={12} />
      <span style={{ 
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>{citation.title}</span>
    </a>
  );
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
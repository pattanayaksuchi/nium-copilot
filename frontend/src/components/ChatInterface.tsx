'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, Copy, Check, RotateCcw } from 'lucide-react';
import { useConversation, useSendMessage } from '../hooks/useConversations';
import { useConversationStore } from '../store/conversationStore';
import { Message, Citation } from '../lib/api';
import { MessageSkeleton } from './LoadingSkeleton';
import { useToast } from './Toast';

interface ChatInterfaceProps {
  isCompact?: boolean;
}

export function ChatInterface({ isCompact = false }: ChatInterfaceProps = {}) {
  const { selectedConversationId, composerText, setComposerText, resetComposer } = useConversationStore();
  const { data: conversation, isLoading } = useConversation(selectedConversationId);
  const sendMessage = useSendMessage();
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
    if (!composerText.trim() || sendMessage.isPending) return;
    
    try {
      // If no conversation selected, we'll need to create one via the message endpoint
      if (!selectedConversationId) {
        // For now, we'll send to a default conversation ID or let the backend handle it
        await sendMessage.mutateAsync({
          conversationId: 'new', // Backend should handle creating new conversation
          content: composerText.trim()
        });
      } else {
        await sendMessage.mutateAsync({
          conversationId: selectedConversationId,
          content: composerText.trim()
        });
      }
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
                onClick={() => setComposerText('How do I validate a payout payload for Australia?')}
              >
                💸 Validate payout payload for Australia
              </button>
              <button 
                className="chat-suggestion-btn"
                onClick={() => setComposerText('Show me API integration examples for USD transfers')}
              >
                🔗 API integration examples for USD
              </button>
              <button 
                className="chat-suggestion-btn"
                onClick={() => setComposerText('What are the required fields for Singapore payouts?')}
              >
                📋 Required fields for Singapore payouts
              </button>
              {!isCompact && (
                <button 
                  className="chat-suggestion-btn"
                  onClick={() => setComposerText('Generate a cURL example for bank transfer to UK')}
                >
                  🛠️ Generate cURL example for UK bank transfer
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Always show composer even without conversation */}
        <div className={`chat-composer ${isCompact ? 'chat-composer-compact' : ''}`}>
          <div className={isCompact ? '' : 'chat-composer-container'}>
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
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-surface">
        <div className="px-6 py-4 border-b border-subtle bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 skeleton rounded-full"></div>
            <div className="space-y-1">
              <div className="skeleton h-4 w-32 rounded"></div>
              <div className="skeleton h-3 w-24 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface">
      {/* Header - Hide in compact mode */}
      {!isCompact && (
        <div className="px-6 py-4 border-b border-subtle bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {conversation?.title || 'New Chat'}
              </h1>
              <p className="text-sm text-muted mt-1">
                AI-powered assistant for Nium integration teams
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                Online
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-transparent to-blue-50/30">
        <div className={`mx-auto space-y-4 ${isCompact ? 'px-3 py-3 max-w-none' : 'max-w-4xl px-6 py-6 space-y-6'}`}>
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
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="bubble-assistant max-w-xs px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm text-muted">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Composer */}
      <div className="border-t border-subtle bg-surface shadow-sm" style={{ padding: isCompact ? '12px' : '16px' }}>
        <div className={isCompact ? '' : 'max-w-4xl mx-auto'}>
          <div className={`flex items-end ${isCompact ? 'gap-2' : 'gap-3'}`}>
            <div className="flex-1 relative">
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
                className={`w-full bg-surface border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-custom placeholder-text-subtle ${
                  isCompact ? 'px-3 py-2 pr-8 text-sm' : 'px-4 py-3 pr-12'
                }`}
                rows={1}
                style={{
                  minHeight: isCompact ? '36px' : '48px',
                  maxHeight: isCompact ? '80px' : '120px'
                }}
              />
              {!isCompact && composerText.length > 0 && (
                <div className="absolute bottom-2 right-2 text-xs text-subtle">
                  <span>{composerText.length}/2000</span>
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!composerText.trim() || sendMessage.isPending}
              className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                isCompact ? 'p-2' : 'p-3'
              }`}
            >
              <Send className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
            </button>
          </div>
          {!isCompact && (
            <div className="flex items-center justify-between mt-2 text-xs text-subtle">
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
      className={`flex items-start gap-4 group ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
        isUser 
          ? 'bg-gradient-to-br from-gray-600 to-gray-700' 
          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`flex-1 min-w-0 max-w-3xl ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`flex items-center gap-2 mb-2 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="font-medium text-gray-900 text-sm">
            {isUser ? 'You' : 'Nium Copilot'}
          </span>
          <span className="text-xs text-muted">{timestamp}</span>
        </div>
        
        <div className={`relative ${
          isUser 
            ? 'bubble-user max-w-lg ml-auto' 
            : 'bubble-assistant max-w-4xl'
        } px-4 py-3 rounded-2xl shadow-sm`}>
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
            {message.content}
          </div>
          
          {/* Hover Actions Toolbar */}
          {isHovered && (
            <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} flex items-center gap-1 bg-surface border border-subtle rounded-lg px-2 py-1 shadow-custom opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
              <button
                onClick={() => onCopy(message.content, message.id)}
                className="p-1 text-muted hover:text-gray-700 rounded transition-custom"
                title="Copy message"
              >
                {copiedMessageId === message.id ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              {!isUser && (
                <button
                  className="p-1 text-muted hover:text-gray-700 rounded transition-custom"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className={`mt-3 space-y-2 ${isUser ? 'self-end' : ''}`}>
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide">Sources</h4>
            <div className="flex flex-wrap gap-2">
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs text-blue-700 hover:text-blue-800 transition-custom hover-lift"
      title={citation.snippet}
    >
      <ExternalLink className="w-3 h-3" />
      <span className="font-medium truncate max-w-32">{citation.title}</span>
    </a>
  );
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
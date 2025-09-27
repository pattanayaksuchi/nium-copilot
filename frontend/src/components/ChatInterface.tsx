'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, Copy, Check } from 'lucide-react';
import { useConversation, useSendMessage } from '../hooks/useConversations';
import { useConversationStore } from '../store/conversationStore';
import { Message, Citation } from '../lib/api';

export function ChatInterface() {
  const { selectedConversationId, composerText, setComposerText, resetComposer } = useConversationStore();
  const { data: conversation, isLoading } = useConversation(selectedConversationId);
  const sendMessage = useSendMessage();
  
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleSend = async () => {
    if (!selectedConversationId || !composerText.trim() || sendMessage.isPending) return;
    
    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: composerText.trim()
      });
      resetComposer();
    } catch (error) {
      console.error('Failed to send message:', error);
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
    } catch (error) {
      console.error('Failed to copy:', error);
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
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto">
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to Nium Developer Copilot
          </h3>
          <p className="text-gray-600 mb-6">
            Your AI-powered assistant for payout integration. Start a new conversation to get 
            instant playbooks, validation guardrails, and docs-aware guidance.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✓ Instant payout playbooks</p>
            <p>✓ Validation guardrails</p>
            <p>✓ Dynamic examples</p>
            <p>✓ Docs-aware chat functionality</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">
          {conversation?.title || 'New Chat'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          AI-powered assistant for Nium integration teams
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {conversation?.messages?.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onCopy={copyToClipboard}
            copiedMessageId={copiedMessageId}
          />
        ))}
        
        {sendMessage.isPending && (
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about payout methods, validation requirements, API integration..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '48px',
                height: Math.min(textareaRef.current?.scrollHeight || 48, 128) + 'px'
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!composerText.trim() || sendMessage.isPending}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onCopy: (text: string, messageId: string) => void;
  copiedMessageId: string | null;
}

function MessageBubble({ message, onCopy, copiedMessageId }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const timestamp = formatTimestamp(message.created_at);

  return (
    <div className="flex items-start gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-gray-600' : 'bg-blue-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            {isUser ? 'You' : 'Nium Copilot'}
          </span>
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {message.content}
          </div>
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Sources:</h4>
            {message.citations.map((citation, index) => (
              <CitationCard key={index} citation={citation} />
            ))}
          </div>
        )}

        {/* Copy button */}
        <button
          onClick={() => onCopy(message.content, message.id)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {copiedMessageId === message.id ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface CitationCardProps {
  citation: Citation;
}

function CitationCard({ citation }: CitationCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 text-sm truncate">
            {citation.title}
          </h5>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {citation.snippet}
          </p>
        </div>
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
          title="Open source"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
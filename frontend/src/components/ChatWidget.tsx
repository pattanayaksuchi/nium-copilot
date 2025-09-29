'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Maximize2, Minimize2, Bot } from 'lucide-react';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatInterface } from './ChatInterface';
import { AppShell } from './AppShell';
import { useConversationStore } from '../store/conversationStore';

type WidgetState = 'minimized' | 'compact' | 'maximized';

// Centralized allowed origins for security
const ALLOWED_ORIGINS = [
  'https://docs.nium.com',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
  // Add Replit development domains
  ...(typeof window !== 'undefined' && window.location.hostname.includes('replit.dev') 
    ? [`${window.location.protocol}//${window.location.hostname}`] 
    : []),
];

export function ChatWidget() {
  const [widgetState, setWidgetState] = useState<WidgetState>('minimized');
  const [isVisible, setIsVisible] = useState(false);
  const [hostConfig, setHostConfig] = useState<any>(null);
  const { selectedConversationId } = useConversationStore();

  useEffect(() => {
    // Show widget immediately in minimized state
    setIsVisible(true);
    // Start minimized so user can click to expand
    setWidgetState('minimized');
  }, []);

  // PostMessage communication with parent page - SECURE VERSION
  useEffect(() => {
    const sendMessage = (data: any) => {
      if (window.parent && window.parent !== window) {
        // Use specific target origin if available from hostConfig
        const targetOrigin = hostConfig?.origin || (ALLOWED_ORIGINS.includes(window.location.origin) ? window.location.origin : ALLOWED_ORIGINS[0]);
        window.parent.postMessage(data, targetOrigin);
      }
    };

    // Listen for messages from parent
    const handleMessage = (event: MessageEvent) => {
      // Validate event origin for security
      if (!ALLOWED_ORIGINS.includes(event.origin)) {
        console.warn('Blocked message from unauthorized origin:', event.origin);
        return;
      }

      // Sanitize and validate message data
      if (event.data && typeof event.data === 'object' && event.data.type === 'nium-copilot-config') {
        // Validate config structure before setting
        if (event.data.config && typeof event.data.config === 'object') {
          setHostConfig({
            ...event.data.config,
            origin: event.origin // Store validated origin
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Send ready message to parent after a brief delay
    const readyTimer = setTimeout(() => {
      const sendSecureMessage = (data: any) => {
        if (window.parent && window.parent !== window) {
          const targetOrigin = ALLOWED_ORIGINS.includes(window.location.origin) ? window.location.origin : ALLOWED_ORIGINS[0];
          window.parent.postMessage(data, targetOrigin);
        }
      };
      sendSecureMessage({ type: 'nium-copilot-ready' });
    }, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(readyTimer);
    };
  }, [hostConfig]);

  // Send resize messages when state changes
  useEffect(() => {
    const sendMessage = (data: any) => {
      if (window.parent && window.parent !== window) {
        const targetOrigin = hostConfig?.origin || (ALLOWED_ORIGINS.includes(window.location.origin) ? window.location.origin : ALLOWED_ORIGINS[0]);
        window.parent.postMessage(data, targetOrigin);
      }
    };

    const sizes = {
      minimized: { width: 56, height: 56 },
      compact: { width: 400, height: 550 }, // Increased height to show input box fully
      maximized: { width: window.innerWidth - 32, height: window.innerHeight - 32 }
    };

    const size = sizes[widgetState];
    
    sendMessage({
      type: 'nium-copilot-resize',
      state: widgetState,
      ...size
    });

    // Send expand/minimize events
    if (widgetState !== 'minimized') {
      sendMessage({ type: 'nium-copilot-expand', state: widgetState });
    } else {
      sendMessage({ type: 'nium-copilot-minimize', state: widgetState });
    }

    // Analytics events
    sendMessage({
      type: 'nium-copilot-analytics',
      action: `widget_${widgetState}`,
      label: `State changed to ${widgetState}`,
      timestamp: Date.now()
    });
  }, [widgetState, hostConfig?.origin]);

  const handleStateChange = (newState: WidgetState) => {
    setWidgetState(newState);
    
    // Send analytics for user interactions
    const sendMessage = (data: any) => {
      if (window.parent && window.parent !== window) {
        const targetOrigin = hostConfig?.origin || (ALLOWED_ORIGINS.includes(window.location.origin) ? window.location.origin : ALLOWED_ORIGINS[0]);
        window.parent.postMessage(data, targetOrigin);
      }
    };
    
    sendMessage({
      type: 'nium-copilot-analytics',
      action: `user_interaction`,
      label: `User changed widget to ${newState}`,
      previousState: widgetState,
      newState: newState,
      timestamp: Date.now()
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay backdrop for maximized state */}
      {widgetState === 'maximized' && (
        <div 
          className="widget-overlay"
          onClick={() => handleStateChange('compact')}
        />
      )}

      {/* Chat Widget */}
      <div className={`widget-container ${
        widgetState === 'minimized' 
          ? 'widget-minimized'
          : widgetState === 'compact'
          ? 'widget-compact'
          : 'widget-maximized'
      }`}>
        {widgetState === 'minimized' ? (
          <MinimizedWidget onClick={() => handleStateChange('compact')} />
        ) : widgetState === 'compact' ? (
          <CompactWidget 
            onMinimize={() => handleStateChange('minimized')}
            onMaximize={() => handleStateChange('maximized')}
          />
        ) : (
          <MaximizedWidget 
            onMinimize={() => handleStateChange('compact')}
            onClose={() => handleStateChange('minimized')}
          />
        )}
      </div>
    </>
  );
}

function MinimizedWidget({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="widget-button"
      style={{ 
        position: 'relative',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <MessageCircle size={28} />
      
      {/* Pulsing indicator for new features */}
      <div style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        width: '16px',
        height: '16px',
        backgroundColor: '#10b981',
        borderRadius: '50%',
        border: '2px solid white',
        animation: 'pulse 2s infinite',
        pointerEvents: 'none'
      }}></div>
    </button>
  );
}

function CompactWidget({ 
  onMinimize, 
  onMaximize 
}: { 
  onMinimize: () => void;
  onMaximize: () => void;
}) {
  return (
    <div className="widget-content">
      {/* Compact Header */}
      <div className="widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={16} />
          </div>
          <div>
            <h3 className="widget-title">Nium Copilot</h3>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>AI Assistant</p>
          </div>
        </div>
        <div className="widget-controls">
          <button
            onClick={onMaximize}
            className="widget-control-btn"
            title="Expand"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={onMinimize}
            className="widget-control-btn"
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      {/* Compact Chat Interface */}
      <div className="widget-body">
        <ChatInterface isCompact={true} />
      </div>
    </div>
  );
}

function MaximizedWidget({ 
  onMinimize, 
  onClose 
}: { 
  onMinimize: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Maximized Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: 'white',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Nium Developer Copilot</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              AI-powered assistant for payout integration
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onMinimize}
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            title="Minimize to compact"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <Minimize2 size={20} />
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Full App Shell */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          width: '320px', 
          borderRight: '1px solid #e5e7eb' 
        }}>
          <ConversationSidebar />
        </div>
        <div style={{ 
          flex: 1 
        }}>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
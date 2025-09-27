'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Maximize2, Minimize2, Bot } from 'lucide-react';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatInterface } from './ChatInterface';
import { AppShell } from './AppShell';
import { useConversationStore } from '../store/conversationStore';

type WidgetState = 'minimized' | 'compact' | 'maximized';

export function ChatWidget() {
  const [widgetState, setWidgetState] = useState<WidgetState>('minimized');
  const [isVisible, setIsVisible] = useState(false);
  const [hostConfig, setHostConfig] = useState<any>(null);
  const { selectedConversationId } = useConversationStore();

  useEffect(() => {
    // Show widget immediately and expand to compact mode for testing
    setIsVisible(true);
    setWidgetState('compact'); // Show compact immediately for testing
  }, []);

  // PostMessage communication with parent page
  useEffect(() => {
    const sendMessage = (data: any) => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, '*');
      }
    };

    // Listen for messages from parent
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'nium-copilot-config') {
        setHostConfig(event.data.config);
      }
    };

    window.addEventListener('message', handleMessage);

    // Send ready message to parent after a brief delay
    const readyTimer = setTimeout(() => {
      sendMessage({ type: 'nium-copilot-ready' });
    }, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(readyTimer);
    };
  }, []);

  // Send resize messages when state changes
  useEffect(() => {
    const sendMessage = (data: any) => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, '*');
      }
    };

    const sizes = {
      minimized: { width: 56, height: 56 },
      compact: { width: 400, height: 500 },
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
  }, [widgetState]);

  const handleStateChange = (newState: WidgetState) => {
    setWidgetState(newState);
    
    // Send analytics for user interactions
    const sendMessage = (data: any) => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, '*');
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
      style={{ position: 'relative' }}
    >
      <MessageCircle size={24} />
      
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
        animation: 'pulse 2s infinite'
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
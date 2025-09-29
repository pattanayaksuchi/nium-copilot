'use client';

import { Search, Sun, Moon, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function DocsPage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Header */}
      <div className="header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {/* Logo and Navigation */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="nium-logo">NIUM</span>
                <span className="docs-label">Docs</span>
              </div>
              
              <nav className="nav-links">
                <a href="#" className="nav-link">Guides</a>
                <a href="#" className="nav-link">API Reference</a>
                <a href="#" className="nav-link">Changelog</a>
              </nav>
            </div>

            {/* Search and Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="search-box">
                <div className="search-icon">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="search-input"
                />
                <div style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  fontSize: '12px',
                  color: '#6b7280',
                  backgroundColor: '#f3f4f6',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  ⌘K
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  style={{
                    padding: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#6b7280'
                  }}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                
                {/* Chat Bot Button */}
                <a 
                  href="/dev-copilot"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <MessageCircle size={16} />
                  Developer Copilot
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main style={{ backgroundColor: '#fff' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '80px 20px 64px', backgroundColor: '#fff' }}>
          <div className="container">
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '700', 
              color: '#111827', 
              marginBottom: '24px',
              lineHeight: '1.1'
            }}>
              Ship payouts faster <br />
              <span style={{ color: '#2563eb' }}>across corridors</span>
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              color: '#6b7280', 
              marginBottom: '48px',
              maxWidth: '600px',
              margin: '0 auto 48px'
            }}>
              AI-powered assistant with instant payout playbooks, validation guardrails, 
              and dynamic examples from official Nium documentation.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a 
                href="/dev-copilot"
                style={{
                  padding: '16px 32px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MessageCircle size={20} />
                Start Building
              </a>
              <a 
                href="#api-reference"
                style={{
                  padding: '16px 32px',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: '2px solid #e5e7eb'
                }}
              >
                API Reference
              </a>
            </div>
          </div>
        </div>

        {/* Solutions Section */}
        <div style={{ padding: '64px 20px', backgroundColor: '#f9fafb' }}>
          <div className="container">
            <h2 className="section-title">SOLUTIONS</h2>
            <div className="cards-grid">
              <div className="card">
                <h4 className="card-title">Remittances</h4>
                <p className="card-text">
                  Send money globally with real-time FX rates and instant settlement
                </p>
              </div>
              
              <div className="card">
                <h4 className="card-title">Payouts</h4>
                <p className="card-text">
                  Bulk payments to contractors, suppliers, and partners worldwide
                </p>
              </div>
              
              <div className="card">
                <h4 className="card-title">Embedded Finance</h4>
                <p className="card-text">
                  White-label financial services for your platform
                </p>
              </div>
              
              <div className="card">
                <h4 className="card-title">Banking</h4>
                <p className="card-text">
                  Digital banking infrastructure and compliance tools
                </p>
              </div>
              
              <div className="card">
                <h4 className="card-title">Travel</h4>
                <p className="card-text">
                  Simplify payments for travel agencies, airlines, and hotels
                </p>
              </div>
              
              <div className="card" style={{ opacity: 0.5 }}>
                <h4 className="card-title">More Solutions</h4>
                <p className="card-text">
                  Explore additional use cases and integrations
                </p>
              </div>
              
              <div className="card" style={{ opacity: 0.5 }}>
                <h4 className="card-title">Coming Soon</h4>
                <p className="card-text">
                  New features and capabilities in development
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Section */}
        <div style={{ marginBottom: '64px' }}>
          <h2 className="section-title">PRODUCT</h2>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              Global Infrastructure for Modern Finance
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Build, scale, and launch financial products with Nium&apos;s comprehensive platform. 
              From embedded finance to global payouts, we provide the infrastructure you need.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div>
                <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Global Reach</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Process payments in 100+ countries with local settlement capabilities
                </p>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Developer First</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  RESTful APIs, comprehensive documentation, and powerful SDKs
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Nium. All rights reserved.</p>
        </div>
      </footer>

      {/* Chat Widget - Iframe popup */}
      <div className="chat-widget" id="nium-chat-widget">
        <MessageCircle size={24} />
      </div>

      {/* Chat Widget Script - Iframe popup functionality */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              let widgetFrame = null;
              let isExpanded = false;
              
              function createWidgetFrame() {
                if (widgetFrame) return;
                
                widgetFrame = document.createElement('iframe');
                widgetFrame.src = window.location.origin + '/widget';
                widgetFrame.style.cssText = \`
                  position: fixed;
                  bottom: 24px;
                  right: 24px;
                  width: 56px;
                  height: 56px;
                  border: none;
                  border-radius: 50%;
                  z-index: 2147483647;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                  background: transparent;
                  overflow: hidden;
                \`;
                
                document.body.appendChild(widgetFrame);
                
                // Listen for resize messages from widget  
                window.addEventListener('message', function(event) {
                  // Basic origin validation for security
                  if (event.origin !== window.location.origin) return;
                  if (event.data.type === 'nium-copilot-resize') {
                    const { width, height, state } = event.data;
                    if (state === 'minimized') {
                      widgetFrame.style.width = '56px';
                      widgetFrame.style.height = '56px';
                      widgetFrame.style.borderRadius = '50%';
                      isExpanded = false;
                    } else if (state === 'compact') {
                      widgetFrame.style.width = '400px';
                      widgetFrame.style.height = '500px';
                      widgetFrame.style.borderRadius = '16px';
                      isExpanded = true;
                    } else if (state === 'maximized') {
                      widgetFrame.style.width = 'calc(100vw - 32px)';
                      widgetFrame.style.height = 'calc(100vh - 32px)';
                      widgetFrame.style.borderRadius = '16px';
                      widgetFrame.style.bottom = '16px';
                      widgetFrame.style.right = '16px';
                      isExpanded = true;
                    }
                  }
                });
              }
              
              // Initialize widget
              setTimeout(() => {
                createWidgetFrame();
                
                // Hide the original button since iframe will handle it
                const originalButton = document.getElementById('nium-chat-widget');
                if (originalButton) {
                  originalButton.style.display = 'none';
                }
              }, 1000);
            })();
          `
        }}
      />
    </div>
  );
}
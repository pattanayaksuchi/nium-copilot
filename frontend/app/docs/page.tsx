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
                  fontFamily: 'monospace',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '2px 6px'
                }}>
                  ⌘K
                </div>
              </div>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{ 
                  padding: '8px', 
                  background: 'none', 
                  border: 'none', 
                  color: '#6b7280', 
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">
            <span className="hero-blue">Move Money Globally</span>{" "}
            <span style={{ color: '#111827' }}>with Nium</span>
          </h1>
          <p className="hero-subtitle">
            Documentation for our previous version of payins and payouts (also called Masspay) can be found{" "}
            <a href="#" className="blue-link">here</a>
          </p>
        </div>

        {/* Getting Started Cards */}
        <div className="cards-grid">
          <div className="card">
            <h3 className="card-title">Getting Started</h3>
            <p className="card-text">
              Learn key concepts and how to get start building your integration
            </p>
          </div>
          
          <div className="card">
            <h3 className="card-title">API Reference</h3>
            <p className="card-text">
              Go from idea to implementation quickly with the Nium API
            </p>
          </div>
          
          <div className="card">
            <h3 className="card-title">Changelog</h3>
            <p className="card-text">
              A record of all changes, including bug fixes, enhancements, and new features
            </p>
          </div>
        </div>

        {/* Use Cases Section */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 className="section-title">USECASE</h2>
            <h3 className="section-heading">Real world solutions</h3>
          </div>

          <div className="cards-grid">
            <div className="card">
              <h4 className="card-title">Payroll</h4>
              <p className="card-text">
                Streamline payroll for contractors and employees
              </p>
            </div>
            
            <div className="card">
              <h4 className="card-title">Spend Management</h4>
              <p className="card-text">
                Allocate and track company funds for employee business expenses
              </p>
            </div>
            
            <div className="card">
              <h4 className="card-title">Financial Institutions</h4>
              <p className="card-text">
                Access financial services with in-region licensing for businesses and individuals
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

        {/* Product Section */}
        <div style={{ marginBottom: '64px' }}>
          <h2 className="section-title">PRODUCT</h2>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              Global Infrastructure for Modern Finance
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Build, scale, and launch financial products with Nium's comprehensive platform. 
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

      {/* Chat Widget - Updated for seamless experience */}
      <div className="chat-widget" id="nium-chat-widget">
        <MessageCircle size={24} />
      </div>

      {/* Chat Widget Script - Enhanced for seamless experience */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Enhanced seamless chat widget experience
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
              
              // Initialize widget when page loads
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
'use client';

import { Search, Sun, Moon, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function DocsPage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="flex items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-blue-600">NIUM</span>
                <span className="text-sm font-semibold text-gray-600">Docs</span>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="nav-link">Guides</a>
                <a href="#" className="nav-link">API Reference</a>
                <a href="#" className="nav-link">Changelog</a>
              </nav>
            </div>

            {/* Search and Theme Toggle */}
            <div className="flex items-center space-x-4">
              <div className="search-container">
                <div className="search-icon">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="search-input"
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <kbd style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '4px', 
                    padding: '2px 6px', 
                    fontSize: '12px', 
                    color: '#6b7280',
                    fontFamily: 'monospace'
                  }}>
                    ⌘K
                  </kbd>
                </div>
              </div>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="theme-toggle"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-blue-500">Move Money Globally</span>{" "}
            <span className="text-gray-900">with Nium</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Documentation for our previous version of payins and payouts (also called Masspay) can be found{" "}
            <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>here</a>
          </p>
        </div>

        {/* Getting Started Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Getting Started</h3>
            <p className="text-gray-600 text-sm">
              Learn key concepts and how to get start building your integration
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">API Reference</h3>
            <p className="text-gray-600 text-sm">
              Go from idea to implementation quickly with the Nium API
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Changelog</h3>
            <p className="text-gray-600 text-sm">
              A record of all changes, including bug fixes, enhancements, and new features
            </p>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-wide mb-2">
              USECASE
            </h2>
            <h3 className="text-3xl font-bold text-gray-900">
              Real world solutions
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Payroll</h4>
              <p className="text-gray-600 text-sm">
                Streamline payroll for contractors and employees
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Spend Management</h4>
              <p className="text-gray-600 text-sm">
                Allocate and track company funds for employee business expenses
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Financial Institutions</h4>
              <p className="text-gray-600 text-sm">
                Access financial services with in-region licensing for businesses and individuals
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Travel</h4>
              <p className="text-gray-600 text-sm">
                Simplify payments for travel agencies, airlines, and hotels
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow opacity-50">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">More Solutions</h4>
              <p className="text-gray-600 text-sm">
                Explore additional use cases and integrations
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow opacity-50">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Coming Soon</h4>
              <p className="text-gray-600 text-sm">
                New features and capabilities in development
              </p>
            </div>
          </div>
        </div>

        {/* Product Section */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-wide mb-4">
            PRODUCT
          </h2>
          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Global Infrastructure for Modern Finance
            </h3>
            <p className="text-gray-600 mb-6">
              Build, scale, and launch financial products with Nium's comprehensive platform. 
              From embedded finance to global payouts, we provide the infrastructure you need.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Global Reach</h4>
                <p className="text-sm text-gray-600">
                  Process payments in 100+ countries with local settlement capabilities
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Developer First</h4>
                <p className="text-sm text-gray-600">
                  RESTful APIs, comprehensive documentation, and powerful SDKs
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Nium. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <div className="chat-widget" onClick={() => window.open('/widget', '_blank')}>
        <MessageCircle size={24} />
      </div>

      {/* Chat Widget Integration Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                window.NIUM_COPILOT_URL = window.location.origin + '/widget';
                window.NIUM_COPILOT_CONFIG = {
                  position: { bottom: '24px', right: '24px' },
                  hideOnMobile: false,
                  zIndex: 2147483647
                };
                
                const script = document.createElement('script');
                script.src = '/embed-simple.js';
                script.async = true;
                document.head.appendChild(script);
              }, 1000);
            }
          `
        }}
      />
    </div>
  );
}
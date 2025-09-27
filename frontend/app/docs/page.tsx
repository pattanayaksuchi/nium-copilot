'use client';

import { Search, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

export default function DocsPage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">NIUM</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Docs</span>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  Guides
                </a>
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  API Reference
                </a>
                <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  Changelog
                </a>
              </nav>
            </div>

            {/* Search and Theme Toggle */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <kbd className="inline-flex items-center border border-gray-200 dark:border-gray-600 rounded px-2 py-0.5 text-xs font-mono text-gray-500 dark:text-gray-400">
                    ⌘K
                  </kbd>
                </div>
              </div>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-blue-500">Move Money Globally</span>{" "}
            <span className="text-gray-900 dark:text-white">with Nium</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Documentation for our previous version of payins and payouts (also called Masspay) can be found{" "}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">here</a>
          </p>
        </div>

        {/* Getting Started Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Getting Started</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Learn key concepts and how to get start building your integration
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">API Reference</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Go from idea to implementation quickly with the Nium API
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Changelog</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              A record of all changes, including bug fixes, enhancements, and new features
            </p>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-2">
              USECASE
            </h2>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              Real world solutions
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Payroll</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Streamline payroll for contractors and employees
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Spend Management</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Allocate and track company funds for employee business expenses
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Financial Institutions</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Access financial services with in-region licensing for businesses and individuals
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Travel</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Simplify payments for travel agencies, airlines, and hotels
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow opacity-50">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">More Solutions</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Explore additional use cases and integrations
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow opacity-50">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Coming Soon</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                New features and capabilities in development
              </p>
            </div>
          </div>
        </div>

        {/* Product Section */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-4">
            PRODUCT
          </h2>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Global Infrastructure for Modern Finance
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Build, scale, and launch financial products with Nium's comprehensive platform. 
              From embedded finance to global payouts, we provide the infrastructure you need.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Global Reach</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Process payments in 100+ countries with local settlement capabilities
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Developer First</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  RESTful APIs, comprehensive documentation, and powerful SDKs
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 Nium. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Widget configuration will be handled by layout */}
    </div>
  );
}
/**
 * Nium Developer Copilot Embed Script
 * Add this script to your website to embed the Nium Copilot widget
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        // Default widget URL - update this to your deployed widget URL
        widgetUrl: window.NIUM_COPILOT_URL || 'http://localhost:5000/widget',
        
        // Container ID for the widget
        containerId: 'nium-copilot-widget',
        
        // Z-index for the widget overlay
        zIndex: 2147483647,
        
        // Position settings
        position: {
            bottom: '20px',
            right: '20px'
        }
    };
    
    // Prevent multiple initializations
    if (window.NiumCopilotWidget) {
        console.warn('Nium Copilot Widget already initialized');
        return;
    }
    
    class NiumCopilotWidget {
        constructor() {
            this.iframe = null;
            this.container = null;
            this.isInitialized = false;
        }
        
        init() {
            if (this.isInitialized) return;
            
            this.createContainer();
            this.createIframe();
            this.setupEventListeners();
            this.isInitialized = true;
            
            console.log('Nium Copilot Widget initialized');
        }
        
        createContainer() {
            this.container = document.createElement('div');
            this.container.id = CONFIG.containerId;
            this.container.style.cssText = `
                position: fixed;
                bottom: ${CONFIG.position.bottom};
                right: ${CONFIG.position.right};
                z-index: ${CONFIG.zIndex};
                pointer-events: auto;
                width: 56px;
                height: 56px;
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(this.container);
        }
        
        createIframe() {
            this.iframe = document.createElement('iframe');
            this.iframe.src = CONFIG.widgetUrl;
            this.iframe.style.cssText = `
                width: 56px;
                height: 56px;
                border: none;
                background: transparent;
                pointer-events: auto;
                border-radius: 28px;
                transition: all 0.3s ease;
            `;
            this.iframe.allow = 'clipboard-write';
            this.iframe.title = 'Nium Developer Copilot';
            
            this.container.appendChild(this.iframe);
        }
        
        setupEventListeners() {
            // Listen for messages from the widget iframe
            window.addEventListener('message', (event) => {
                if (!this.iframe || event.source !== this.iframe.contentWindow) return;
                
                this.handleWidgetMessage(event.data);
            });
            
            // Handle responsive design
            window.addEventListener('resize', () => {
                this.handleResize();
            });
        }
        
        handleWidgetMessage(data) {
            switch (data.type) {
                case 'nium-copilot-resize':
                    this.handleResize(data.width, data.height, data.state);
                    break;
                    
                case 'nium-copilot-ready':
                    this.sendConfig();
                    break;
                    
                case 'nium-copilot-minimize':
                    this.handleMinimize();
                    break;
                    
                case 'nium-copilot-expand':
                    this.handleExpand(data.state);
                    break;
                    
                case 'nium-copilot-analytics':
                    this.handleAnalytics(data);
                    break;
            }
        }
        
        handleResize(width, height, state) {
            if (!this.iframe || !this.container) return;
            
            const isMobile = window.innerWidth <= 768;
            
            // Update iframe size
            this.iframe.style.width = width + 'px';
            this.iframe.style.height = height + 'px';\n            \n            // Update container size and position based on state\n            this.container.style.width = width + 'px';\n            this.container.style.height = height + 'px';\n            \n            if (state === 'minimized') {\n                this.container.style.bottom = CONFIG.position.bottom;\n                this.container.style.right = CONFIG.position.right;\n                this.iframe.style.borderRadius = '28px';\n            } else if (state === 'compact') {\n                this.container.style.bottom = CONFIG.position.bottom;\n                this.container.style.right = CONFIG.position.right;\n                this.iframe.style.borderRadius = '16px';\n            } else if (state === 'maximized') {\n                // Center on screen with some padding\n                this.container.style.bottom = '16px';\n                this.container.style.right = '16px';\n                this.container.style.left = '16px';\n                this.container.style.top = '16px';\n                this.container.style.width = 'auto';\n                this.container.style.height = 'auto';\n                this.iframe.style.width = '100%';\n                this.iframe.style.height = '100%';\n                this.iframe.style.borderRadius = '16px';\n            }\n        }\n        \n        handleMinimize() {\n            // Minimized state - ensure proper positioning\n            this.container.style.left = 'auto';\n            this.container.style.top = 'auto';\n        }\n        \n        handleExpand(state) {\n            // Expanded states - compact or maximized\n            if (state === 'maximized') {\n                // Full overlay positioning handled in handleResize\n            }\n        }\n        \n        handleAnalytics(data) {\n            // Forward analytics to parent page's analytics system\n            if (window.gtag) {\n                window.gtag('event', data.action, {\n                    'event_category': 'Nium Copilot',\n                    'event_label': data.label,\n                    'custom_parameter_1': data.timestamp\n                });\n            }\n            \n            // Also dispatch custom event for other analytics systems\n            window.dispatchEvent(new CustomEvent('nium-copilot-analytics', {\n                detail: data\n            }));\n        }
        
        sendConfig() {
            if (!this.iframe || !this.iframe.contentWindow) return;
            
            this.iframe.contentWindow.postMessage({
                type: 'nium-copilot-config',
                config: {
                    hostDomain: window.location.hostname,
                    hostUrl: window.location.href,
                    isMobile: window.innerWidth <= 768
                }
            }, '*');
        }
        
        destroy() {
            if (this.container) {
                document.body.removeChild(this.container);
            }
            this.isInitialized = false;
        }
    }
    
    // Initialize widget
    function initWidget() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initWidget);
            return;
        }
        
        window.NiumCopilotWidget = new NiumCopilotWidget();
        window.NiumCopilotWidget.init();
    }
    
    // Auto-initialize or expose for manual initialization
    if (window.NIUM_COPILOT_AUTO_INIT !== false) {
        initWidget();
    } else {
        window.initNiumCopilot = initWidget;
    }
    
})();
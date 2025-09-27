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
                pointer-events: none;
                max-width: 100vw;
                max-height: 100vh;
            `;
            
            document.body.appendChild(this.container);
        }
        
        createIframe() {
            this.iframe = document.createElement('iframe');
            this.iframe.src = CONFIG.widgetUrl;
            this.iframe.style.cssText = `
                width: 100vw;
                height: 100vh;
                border: none;
                background: transparent;
                pointer-events: auto;
                border-radius: 0;
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
                    this.handleResize(data.width, data.height);
                    break;
                    
                case 'nium-copilot-ready':
                    this.sendConfig();
                    break;
                    
                case 'nium-copilot-minimize':
                    this.container.style.pointerEvents = 'none';
                    break;
                    
                case 'nium-copilot-expand':
                    this.container.style.pointerEvents = 'auto';
                    break;
            }
        }
        
        handleResize(width, height) {
            if (!this.iframe) return;
            
            // Responsive behavior
            const isMobile = window.innerWidth <= 768;
            
            if (width && height) {
                this.iframe.style.width = width + 'px';
                this.iframe.style.height = height + 'px';
            } else if (isMobile) {
                this.iframe.style.width = '100vw';
                this.iframe.style.height = '100vh';
                this.container.style.bottom = '0';
                this.container.style.right = '0';
            } else {
                this.iframe.style.width = '100vw';
                this.iframe.style.height = '100vh';
                this.container.style.bottom = CONFIG.position.bottom;
                this.container.style.right = CONFIG.position.right;
            }
        }
        
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
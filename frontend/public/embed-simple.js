/**
 * Nium Developer Copilot Embed Script - Simplified Version
 */

(function() {
    'use strict';
    
    // Configuration
    const WIDGET_URL = window.NIUM_COPILOT_URL || 'http://localhost:5000/widget';
    const CONTAINER_ID = 'nium-copilot-widget';
    const CONFIG = window.NIUM_COPILOT_CONFIG || {};
    const Z_INDEX = CONFIG.zIndex || 2147483647;
    const POSITION = CONFIG.position || { bottom: '20px', right: '20px' };
    const HIDE_ON_MOBILE = CONFIG.hideOnMobile || false;
    const MOBILE_BREAKPOINT = CONFIG.mobileBreakpoint || 768;
    
    let container = null;
    let iframe = null;
    
    function createWidget() {
        // Create container
        container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.style.cssText = `
            position: fixed;
            bottom: ${POSITION.bottom};
            right: ${POSITION.right};
            z-index: ${Z_INDEX};
            pointer-events: auto;
            width: 56px;
            height: 56px;
            transition: all 0.3s ease;
        `;
        
        // Create iframe
        iframe = document.createElement('iframe');
        iframe.src = WIDGET_URL;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
            border-radius: 28px;
            transition: all 0.3s ease;
        `;
        iframe.allow = 'clipboard-write';
        iframe.title = 'Nium Developer Copilot';
        
        container.appendChild(iframe);
        document.body.appendChild(container);
        
        // Listen for messages from widget
        window.addEventListener('message', handleMessage);
    }
    
    function handleMessage(event) {
        if (!iframe || event.source !== iframe.contentWindow) return;
        
        const data = event.data;
        
        if (data.type === 'nium-copilot-resize') {
            resizeWidget(data.width, data.height, data.state);
        } else if (data.type === 'nium-copilot-ready') {
            sendConfig();
        } else if (data.type === 'nium-copilot-analytics') {
            handleAnalytics(data);
        }
    }
    
    function resizeWidget(width, height, state) {
        if (!container || !iframe) return;
        
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        
        if (state === 'minimized') {
            container.style.bottom = POSITION.bottom;
            container.style.right = POSITION.right;
            container.style.left = 'auto';
            container.style.top = 'auto';
            iframe.style.borderRadius = '28px';
        } else if (state === 'compact') {
            container.style.bottom = POSITION.bottom;
            container.style.right = POSITION.right;
            container.style.left = 'auto';
            container.style.top = 'auto';
            iframe.style.borderRadius = '16px';
        } else if (state === 'maximized') {
            container.style.bottom = '16px';
            container.style.right = '16px';
            container.style.left = '16px';
            container.style.top = '16px';
            container.style.width = 'auto';
            container.style.height = 'auto';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.borderRadius = '16px';
        }
    }
    
    function sendConfig() {
        if (!iframe || !iframe.contentWindow) return;
        
        iframe.contentWindow.postMessage({
            type: 'nium-copilot-config',
            config: {
                hostDomain: window.location.hostname,
                hostUrl: window.location.href,
                isMobile: window.innerWidth <= 768
            }
        }, '*');
    }
    
    function handleAnalytics(data) {
        // Forward to Google Analytics if available
        if (window.gtag) {
            window.gtag('event', data.action, {
                'event_category': 'Nium Copilot',
                'event_label': data.label
            });
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('nium-copilot-analytics', {
            detail: data
        }));
    }
    
    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        if (document.getElementById(CONTAINER_ID)) {
            console.warn('Nium Copilot Widget already exists');
            return;
        }
        
        // Check if should hide on mobile
        if (HIDE_ON_MOBILE && window.innerWidth <= MOBILE_BREAKPOINT) {
            console.log('Nium Copilot Widget hidden on mobile');
            return;
        }
        
        createWidget();
        console.log('Nium Copilot Widget initialized');
    }
    
    // Auto-initialize unless disabled
    if (window.NIUM_COPILOT_AUTO_INIT !== false) {
        init();
    } else {
        window.initNiumCopilot = init;
    }
    
})();
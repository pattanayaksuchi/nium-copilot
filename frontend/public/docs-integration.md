# Nium Developer Copilot - Docs Integration Guide

## Overview

This guide shows how to embed the Nium Developer Copilot as a floating chat widget on docs.nium.com. Users can interact with the assistant in three states:

1. **Minimized**: Small chat button in bottom-right corner
2. **Compact**: 400px wide chat interface 
3. **Maximized**: Full-screen conversation experience

## Integration Methods

### Method 1: Direct Script Embed (Recommended)

Add this script tag to your docs site before the closing `</body>` tag:

```html
<script>
  window.NIUM_COPILOT_URL = 'https://your-copilot-domain.com/widget';
</script>
<script src="https://your-copilot-domain.com/embed.js"></script>
```

### Method 2: Manual Initialization

For more control over when the widget loads:

```html
<script>
  window.NIUM_COPILOT_AUTO_INIT = false;
  window.NIUM_COPILOT_URL = 'https://your-copilot-domain.com/widget';
</script>
<script src="https://your-copilot-domain.com/embed.js"></script>
<script>
  // Initialize when ready
  document.addEventListener('DOMContentLoaded', function() {
    if (window.initNiumCopilot) {
      window.initNiumCopilot();
    }
  });
</script>
```

### Method 3: iframe Embed

For maximum isolation, use the iframe method:

```html
<div id="nium-copilot-container"></div>
<script>
  const iframe = document.createElement('iframe');
  iframe.src = 'https://your-copilot-domain.com/widget';
  iframe.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    z-index: 2147483647;
    pointer-events: none;
  `;
  iframe.allow = 'clipboard-write';
  document.getElementById('nium-copilot-container').appendChild(iframe);
</script>
```

## Widget States & Behavior

### Minimized State
- Small circular button (56px × 56px)
- Positioned in bottom-right corner
- Pulsing green indicator for "new features"
- Click to expand to compact state

### Compact State  
- 400px × 500px chat interface
- Shows conversation sidebar (if conversations exist)
- Full chat functionality in smaller space
- Minimize/Maximize buttons in header

### Maximized State
- Full-screen overlay with backdrop
- Complete two-pane layout (sidebar + chat)
- All conversation management features
- Close to return to compact or minimize

## Customization Options

### Positioning
```javascript
// Custom positioning
window.NIUM_COPILOT_CONFIG = {
  position: {
    bottom: '30px',
    right: '30px'
  }
};
```

### Auto-Hide on Mobile
```javascript
window.NIUM_COPILOT_CONFIG = {
  hideOnMobile: true,
  mobileBreakpoint: 768
};
```

### Custom Styling
The widget respects your site's existing z-index hierarchy and won't interfere with navigation or other overlays.

## Security & Performance

- Widget runs in isolated iframe for security
- No access to parent page content or cookies  
- Lazy-loaded - doesn't impact initial page load
- Minimal JavaScript footprint (~15KB gzipped)
- Uses modern CSS for smooth animations

## Deployment Steps

1. **Deploy the Widget**: Host the widget application at `/widget` endpoint
2. **Configure URLs**: Update `NIUM_COPILOT_URL` to your deployed domain
3. **Add to Docs**: Include embed script on docs.nium.com
4. **Test Integration**: Verify all three widget states work correctly
5. **Monitor Usage**: Track engagement through widget analytics

## Browser Support

- Chrome 80+
- Firefox 75+  
- Safari 13+
- Edge 80+

## Development & Testing

For local development:
```html
<script>
  window.NIUM_COPILOT_URL = 'http://localhost:5000/widget';
</script>
<script src="http://localhost:5000/embed.js"></script>
```

Test all three states:
1. Click minimized button → compact state
2. Click maximize button → full-screen state  
3. Click minimize → back to compact
4. Click close → back to minimized

## Analytics Integration

Track widget usage:
```javascript
window.addEventListener('message', function(event) {
  if (event.data.type === 'nium-copilot-analytics') {
    // Send to your analytics platform
    gtag('event', event.data.action, {
      'event_category': 'Nium Copilot',
      'event_label': event.data.label
    });
  }
});
```

The widget automatically tracks:
- Widget opens/closes
- Message sends
- Conversation creates
- Feature usage
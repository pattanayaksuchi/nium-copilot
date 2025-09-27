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
<script src="https://your-copilot-domain.com/embed-simple.js"></script>
```

### Method 2: Manual Initialization

For more control over when the widget loads:

```html
<script>
  window.NIUM_COPILOT_AUTO_INIT = false;
  window.NIUM_COPILOT_URL = 'https://your-copilot-domain.com/widget';
</script>
<script src="https://your-copilot-domain.com/embed-simple.js"></script>
<script>
  // Initialize when ready
  document.addEventListener('DOMContentLoaded', function() {
    if (window.initNiumCopilot) {
      window.initNiumCopilot();
    }
  });
</script>
```

### Method 3: iframe Embed (Not Recommended)

**Note**: Direct iframe embedding without the companion script is not recommended as it lacks proper sizing and interaction handling. Use Method 1 instead for best results.

If you must use iframe-only embedding:

```html
<div id="nium-copilot-container"></div>
<script>
  // WARNING: This method doesn't provide optimal user experience
  const iframe = document.createElement('iframe');
  iframe.src = 'https://your-copilot-domain.com/widget';
  iframe.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border: none;
    border-radius: 28px;
    z-index: 2147483647;
  `;
  iframe.allow = 'clipboard-write';
  document.getElementById('nium-copilot-container').appendChild(iframe);
</script>
```

**Limitations**: Widget will not resize properly when expanded, and full-screen mode will not work correctly.

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

### Positioning and Mobile Behavior
```javascript
// Custom configuration (set before loading embed script)
window.NIUM_COPILOT_CONFIG = {
  position: {
    bottom: '30px',
    right: '30px'
  },
  zIndex: 1000000,
  hideOnMobile: true,
  mobileBreakpoint: 768
};
```

### Complete Example with Configuration
```html
<script>
  // Configuration
  window.NIUM_COPILOT_URL = 'https://your-copilot-domain.com/widget';
  window.NIUM_COPILOT_CONFIG = {
    position: { bottom: '24px', right: '24px' },
    hideOnMobile: false,
    mobileBreakpoint: 768,
    zIndex: 2147483647
  };
</script>
<script src="https://your-copilot-domain.com/embed-simple.js"></script>
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
  window.NIUM_COPILOT_CONFIG = {
    position: { bottom: '20px', right: '20px' },
    hideOnMobile: false
  };
</script>
<script src="http://localhost:5000/embed-simple.js"></script>
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
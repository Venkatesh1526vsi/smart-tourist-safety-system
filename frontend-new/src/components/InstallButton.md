# PWA Install Feature

This project includes a minimal PWA install prompt feature that enables app installation without affecting the existing UI.

## Features

### 1. Automatic Install Prompt Detection
- Listens for `beforeinstallprompt` event
- Prevents automatic mini-infobar from appearing
- Stores the event for later use
- Logs when install prompt is available

### 2. Global Install Function
- `window.pwaInstall()` - Triggers the install prompt
- Available globally from the console
- Handles user choice and cleanup

### 3. Optional Components

#### InstallButton Component
```tsx
import InstallButton from '@/components/InstallButton';

// Basic usage
<InstallButton />

// Custom styling and text
<InstallButton className="custom-class">
  Install SafeYatra
</InstallButton>
```

#### usePWAInstall Hook
```tsx
import { usePWAInstall } from '@/hooks/usePWAInstall';

function MyComponent() {
  const { canInstall, isInstalled, install } = usePWAInstall();

  if (canInstall) {
    return <button onClick={install}>Install App</button>;
  }

  return null;
}
```

## Console Usage

### Check if install is available
```javascript
// In browser console
window.pwaInstall // Returns function if available
```

### Trigger install prompt
```javascript
// In browser console
window.pwaInstall()
```

## Console Logs

The system provides clear console feedback:

- `"PWA install prompt available - use window.pwaInstall() to trigger install"`
- `"User response to install prompt: accepted/dismissed"`
- `"PWA was successfully installed"`
- `"PWA install prompt not available"`

## Implementation Details

### Event Handling
- `beforeinstallprompt` - Captures and stores install event
- `appinstalled` - Tracks successful installation
- Automatic cleanup after user interaction

### No UI Changes
- No automatic UI modifications
- No layout changes
- No forced prompts
- Completely optional usage

### Browser Support
- Works on Chrome, Edge, and other Chromium browsers
- Graceful fallback on unsupported browsers
- No errors on mobile browsers that don't support PWA

## Usage Examples

### Manual Install Trigger
```javascript
// Check if install is available
if (window.pwaInstall) {
  // Trigger install
  window.pwaInstall();
}
```

### Conditional Install Button
```tsx
const InstallSection = () => {
  const { canInstall, install } = usePWAInstall();

  return canInstall ? (
    <div className="install-prompt">
      <p>Install our app for the best experience!</p>
      <button onClick={install}>Install Now</button>
    </div>
  ) : null;
};
```

## Notes

- Install prompt only appears on eligible browsers/devices
- User must manually trigger install (no forced prompts)
- Component is completely optional - won't appear unless explicitly used
- No impact on existing UI or functionality

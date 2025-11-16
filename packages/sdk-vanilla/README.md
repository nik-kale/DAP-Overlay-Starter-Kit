# @dap-overlay/sdk-vanilla

Vanilla JavaScript SDK for DAP Overlay. Works with any framework or no framework at all.

## Installation

```bash
npm install @dap-overlay/sdk-vanilla
# or
pnpm add @dap-overlay/sdk-vanilla
```

## Usage

### ES Modules

```javascript
import { createOverlay, TelemetryClient } from '@dap-overlay/sdk-vanilla';
import '@dap-overlay/sdk-vanilla/styles.css';

const telemetryClient = new TelemetryClient({ useMock: true });

const overlay = createOverlay({
  steps: stepsData,
  telemetryClient
});

// Update context to trigger overlays
overlay.updateContext(
  { errorId: 'AUTH_401' },
  { path: window.location.pathname }
);

// Register callbacks
overlay.registerCallback('myCallback', () => {
  console.log('CTA clicked!');
});
```

### UMD (via CDN)

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://unpkg.com/@dap-overlay/sdk-vanilla/dist/styles.css">
  </head>
  <body>
    <button id="my-button">Click me</button>

    <script src="https://unpkg.com/@dap-overlay/sdk-vanilla"></script>
    <script>
      const { createOverlay, TelemetryClient } = DAPOverlay;

      const overlay = createOverlay({
        steps: {
          version: '1.0',
          steps: [/* your steps */]
        },
        telemetryClient: new TelemetryClient({ useMock: true })
      });

      overlay.updateContext({ errorId: 'TEST' }, { path: '/' });
    </script>
  </body>
</html>
```

## API

### `createOverlay(options)`

Create an overlay instance.

**Options:**
- `steps`: StepsDocument or Step[]
- `telemetryClient`: TelemetryClient instance
- `callbacks`: Map<string, Function>
- `autoRender`: boolean (default: true)

**Returns:** DAPOverlay instance

### DAPOverlay Methods

#### `updateContext(telemetry?, route?)`

Update context and re-render overlays.

```javascript
overlay.updateContext(
  { errorId: 'AUTH_401', userId: '123' },
  { path: '/dashboard' }
);
```

#### `registerCallback(callbackId, fn)`

Register a callback handler.

```javascript
overlay.registerCallback('retryLogin', () => {
  console.log('Retrying...');
});
```

#### `destroy()`

Remove all overlays and cleanup.

```javascript
overlay.destroy();
```

## Styling

Import the default styles:

```javascript
import '@dap-overlay/sdk-vanilla/styles.css';
```

Or customize using CSS variables:

```css
.dap-overlay {
  --dap-overlay-bg: #ffffff;
  --dap-overlay-text: #1a1a1a;
  --dap-overlay-border: #e0e0e0;
  --dap-overlay-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --dap-overlay-radius: 8px;
  --dap-overlay-padding: 16px;
}
```

## Examples

See [examples/app-vanilla](../../examples/app-vanilla) for a complete demo.

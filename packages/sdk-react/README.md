# @dap-overlay/sdk-react

React components and hooks for DAP Overlay SDK.

## Installation

```bash
npm install @dap-overlay/sdk-react react react-dom
# or
pnpm add @dap-overlay/sdk-react
```

## Usage

### Quick Start

```tsx
import { useGuideEngine, OverlayOrchestrator, TelemetryClient } from '@dap-overlay/sdk-react';
import '@dap-overlay/sdk-react/styles.css';
import steps from './steps.json';

function App() {
  const telemetryClient = new TelemetryClient({ useMock: true });

  const {
    activeSteps,
    handleStepShow,
    handleStepDismiss,
    handleCtaClick,
    registerCallback,
  } = useGuideEngine({
    steps,
    telemetryClient,
    telemetryContext: { errorId: 'AUTH_401' },
    routeContext: { path: '/dashboard' },
  });

  // Register callbacks
  registerCallback('retryLogin', () => {
    console.log('Retry clicked');
  });

  return (
    <>
      <YourApp />
      <OverlayOrchestrator
        steps={activeSteps}
        onStepShow={handleStepShow}
        onStepDismiss={handleStepDismiss}
        onCtaClick={handleCtaClick}
      />
    </>
  );
}
```

## API

### Hooks

#### `useGuideEngine(options)`

Main hook for managing overlay state.

**Options:**
- `steps`: StepsDocument or Step[]
- `telemetryClient`: TelemetryClient instance
- `callbacks`: Map<string, Function>
- `telemetryContext`: TelemetryContext
- `routeContext`: RouteContext

**Returns:**
- `activeSteps`: Step[] - Currently active steps
- `isLoading`: boolean
- `handleStepShow`: (step) => Promise<void>
- `handleStepDismiss`: (step) => Promise<void>
- `handleCtaClick`: (step) => Promise<void>
- `registerCallback`: (id, fn) => void
- `engine`: GuideEngine | null

#### `usePopper(anchorElement, options)`

Hook for Popper.js positioning.

```tsx
const { setPopperElement, setArrowElement } = usePopper(anchorElement, {
  placement: 'bottom',
  offset: [0, 8]
});
```

### Components

#### `<OverlayOrchestrator>`

Renders all active overlays.

```tsx
<OverlayOrchestrator
  steps={activeSteps}
  onStepShow={handleStepShow}
  onStepDismiss={handleStepDismiss}
  onCtaClick={handleCtaClick}
/>
```

#### `<Tooltip>`, `<Banner>`, `<Modal>`

Individual overlay components (usually used via OverlayOrchestrator).

```tsx
<Tooltip
  step={step}
  onDismiss={handleDismiss}
  onCtaClick={handleCtaClick}
/>
```

## Styling

Import default styles:

```tsx
import '@dap-overlay/sdk-react/styles.css';
```

Customize with CSS variables:

```css
.dap-overlay-react {
  --dap-overlay-bg: #ffffff;
  --dap-overlay-text: #1a1a1a;
  --dap-overlay-radius: 8px;
}
```

## TypeScript

Fully typed with excellent IDE support.

```tsx
import type { Step, TelemetryContext } from '@dap-overlay/sdk-react';
```

## Examples

See [examples/app-react](../../examples/app-react) for a complete demo.

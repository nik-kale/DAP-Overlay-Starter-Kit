# DAP Overlay Starter Kit

A production-ready SDK for building contextual in-product overlays (tooltips, banners, modals) with both Vanilla JS and React support. Features Popper.js positioning, JSON schema validation, and secure telemetry integration.

## Features

- 🎯 **Multiple Overlay Types**: Tooltips, banners, and modals
- ⚛️ **Dual SDKs**: Vanilla JS (UMD/ESM) and React (hooks + components)
- 📍 **Smart Positioning**: Powered by Popper.js with auto-placement
- 📋 **JSON Schema**: Define steps with AJV validation
- 📊 **Telemetry**: Mock/real API toggle for events and analytics
- 🔒 **Security**: DOMPurify sanitization, CSP-ready, no eval()
- 🧪 **Tested**: Unit tests (Vitest) + E2E tests (Playwright)
- 📦 **TypeScript**: Fully typed with excellent IDE support
- 🎨 **Customizable**: CSS variables for easy theming

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Applications                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  React App       │      │  Vanilla App     │        │
│  └────────┬─────────┘      └────────┬─────────┘        │
└───────────┼─────────────────────────┼──────────────────┘
            │                         │
┌───────────▼─────────────────────────▼──────────────────┐
│                      SDK Layer                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  sdk-react       │      │  sdk-vanilla     │        │
│  │  (hooks + comps) │      │  (UMD/ESM)       │        │
│  └────────┬─────────┘      └────────┬─────────┘        │
│           └────────────┬─────────────┘                  │
│                        │                                 │
│           ┌────────────▼─────────────┐                  │
│           │      sdk-core             │                  │
│           │  • Types                  │                  │
│           │  • Validator (AJV)        │                  │
│           │  • Evaluator (conditions) │                  │
│           │  • TelemetryClient        │                  │
│           │  • GuideEngine            │                  │
│           │  • Security (DOMPurify)   │                  │
│           └──────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────┐
│              External Dependencies                       │
│  • @popperjs/core  • ajv  • dompurify  • msw            │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dap-overlay-starter-kit

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run React demo
pnpm dev:react

# Run Vanilla demo
pnpm dev:vanilla
```

### Using the React SDK

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
  } = useGuideEngine({
    steps,
    telemetryClient,
    telemetryContext: { errorId: 'AUTH_401' },
    routeContext: { path: '/dashboard' },
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

### Using the Vanilla SDK

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="path/to/sdk-vanilla/styles.css">
  </head>
  <body>
    <button id="login-button">Login</button>

    <script type="module">
      import { createOverlay, TelemetryClient } from '@dap-overlay/sdk-vanilla';

      const telemetryClient = new TelemetryClient({ useMock: true });

      const overlay = createOverlay({
        steps: yourStepsData,
        telemetryClient,
      });

      // Update context to trigger overlays
      overlay.updateContext(
        { errorId: 'AUTH_401' },
        { path: window.location.pathname }
      );
    </script>
  </body>
</html>
```

## JSON Step Schema

Define your overlay steps in JSON:

```json
{
  "version": "1.0",
  "steps": [
    {
      "id": "auth-error-tooltip",
      "type": "tooltip",
      "selector": "#login-button",
      "content": {
        "title": "Authentication Issue",
        "body": "Please check your credentials and try again.",
        "allowHtml": false
      },
      "when": {
        "errorId": "AUTH_401",
        "pathRegex": ".*"
      },
      "popper": {
        "placement": "bottom",
        "offset": [0, 8]
      },
      "actions": {
        "cta": {
          "label": "Retry",
          "callbackId": "retryLogin"
        }
      },
      "telemetry": {
        "onShowEvent": "auth_tooltip_shown",
        "onCtaClickEvent": "auth_retry_clicked"
      }
    }
  ]
}
```

See [schemas/steps.schema.json](./schemas/steps.schema.json) for the full schema definition.

## Telemetry Integration

Toggle between mock and real telemetry:

```typescript
// Mock mode (uses local data)
const telemetryClient = new TelemetryClient({
  useMock: true,
  mockData: { errorId: 'TEST_ERROR' }
});

// Real mode (hits API)
const telemetryClient = new TelemetryClient({
  useMock: false,
  baseUrl: 'https://api.example.com'
});

// Emit events
await telemetryClient.emit('overlay_shown', {
  stepId: 'my-step',
  timestamp: Date.now()
});
```

## Security

This SDK follows security best practices:

- **No eval()**: Safe predicate DSL instead of arbitrary JavaScript
- **HTML Sanitization**: DOMPurify removes XSS vectors
- **Selector Validation**: Prevents injection attacks
- **CSP Compatible**: No inline scripts or styles required
- **Type Safety**: TypeScript prevents common bugs

### Content Security Policy

Recommended CSP headers:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
```

Note: `'unsafe-inline'` for styles is needed for Popper.js inline positioning. For stricter CSP, consider using a nonce-based approach.

## Development

### Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test              # Unit tests
pnpm test:watch        # Watch mode
pnpm e2e               # E2E tests
pnpm e2e:ui            # E2E with UI

# Linting & Formatting
pnpm lint
pnpm format
pnpm typecheck

# Demo apps
pnpm dev:react         # React demo (port 3000)
pnpm dev:vanilla       # Vanilla demo (port 3001)

# Clean
pnpm clean
```

### Package Structure

- `packages/sdk-core` - Core types, validation, telemetry, guide engine
- `packages/sdk-vanilla` - Vanilla JS SDK (UMD/ESM)
- `packages/sdk-react` - React SDK (hooks + components)
- `examples/app-react` - React demo application
- `examples/app-vanilla` - Vanilla JS demo application
- `mocks` - MSW mock server for telemetry
- `schemas` - JSON schemas for validation
- `test` - Unit tests
- `e2e` - Playwright E2E tests

## Bundle Sizes

Approximate gzipped sizes:

- `sdk-core`: ~15KB
- `sdk-vanilla`: ~35KB (includes Popper.js + DOMPurify)
- `sdk-react`: ~12KB (peer deps: React 18+)

## Browser Support

- Chrome/Edge: last 2 versions
- Firefox: last 2 versions
- Safari: last 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android 90+

## Roadmap

- [ ] Accessibility enhancements (ARIA, keyboard nav)
- [ ] Animation/transition customization
- [ ] Multi-step guided tours
- [ ] A/B testing integration
- [ ] Analytics dashboard
- [ ] Vue.js SDK
- [ ] Svelte SDK

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for reporting vulnerabilities.

## License

MIT - see [LICENSE](./LICENSE)

## Credits

Built with:
- [Popper.js](https://popper.js.org/) - Positioning engine
- [AJV](https://ajv.js.org/) - JSON Schema validator
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML sanitizer
- [MSW](https://mswjs.io/) - API mocking
- [Vitest](https://vitest.dev/) - Unit testing
- [Playwright](https://playwright.dev/) - E2E testing

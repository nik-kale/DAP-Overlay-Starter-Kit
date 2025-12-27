# @dap-overlay/sdk-core

Core package for DAP Overlay SDK. Provides types, validation, telemetry client, condition evaluation, and guide engine.

## Installation

```bash
npm install @dap-overlay/sdk-core
# or
pnpm add @dap-overlay/sdk-core
```

## Usage

### Types

```typescript
import type { Step, StepsDocument, TelemetryContext } from '@dap-overlay/sdk-core';
```

### Validation

```typescript
import { validateStepsDocument } from '@dap-overlay/sdk-core';

const result = validateStepsDocument(stepsData);
if (result.valid) {
  console.log('Valid steps:', result.data);
} else {
  console.error('Validation errors:', result.errors);
}
```

### Condition Evaluation

```typescript
import { evaluateConditions } from '@dap-overlay/sdk-core';

const conditions = {
  errorId: 'AUTH_401',
  pathRegex: '/dashboard.*'
};

const context = {
  telemetry: { errorId: 'AUTH_401' },
  route: { path: '/dashboard' }
};

const matches = evaluateConditions(conditions, context); // true
```

### Telemetry Client

```typescript
import { TelemetryClient } from '@dap-overlay/sdk-core';

const client = new TelemetryClient({
  baseUrl: 'https://api.example.com',
  useMock: false
});

// Fetch telemetry
const data = await client.fetchTelemetry({ userId: '123' });

// Emit event
await client.emit('overlay_shown', { stepId: 'my-step' });
```

### Guide Engine

```typescript
import { GuideEngine } from '@dap-overlay/sdk-core';

const engine = new GuideEngine({
  steps: stepsData,
  telemetryClient: client,
  callbacks: new Map([
    ['myCallback', () => console.log('Callback invoked')]
  ])
});

// Resolve active steps
const activeSteps = await engine.resolveActiveSteps(
  { errorId: 'AUTH_401' },
  { path: '/dashboard' }
);

// Lifecycle events
await engine.onStepShow(step);
await engine.onStepDismiss(step);
await engine.onCtaClick(step);
```

### Security

```typescript
import { sanitizeHtml, validateSelector } from '@dap-overlay/sdk-core';

const safeHtml = sanitizeHtml('<p>Hello <script>alert("xss")</script></p>');
// Result: '<p>Hello </p>'

const isValid = validateSelector('#my-element');
// true
```

### Privacy & PII Scrubbing

```typescript
import { 
  AnalyticsEngine,
  PrivacyEngine,
  scrubUrl,
  scrubPii,
  hashUserId 
} from '@dap-overlay/sdk-core';

// Configure analytics with privacy settings
const analytics = new AnalyticsEngine({
  privacy: {
    scrubUrls: true,
    scrubPii: true,
    excludeStackTraces: true,
    hashUserIds: false,
    sensitiveParams: ['custom_token', 'api_secret']
  }
});

// PII is automatically scrubbed from all events
analytics.trackPageView('/checkout?token=abc123&email=user@example.com');
// URL will be scrubbed to: /checkout?token=[REDACTED]&email=[REDACTED]

// Standalone privacy utilities
const cleanUrl = scrubUrl('https://example.com?password=secret123');
// Result: 'https://example.com?password=[REDACTED]'

const cleanText = scrubPii('Contact me at john@example.com or 555-123-4567');
// Result: 'Contact me at [EMAIL_REDACTED] or [PHONE_REDACTED]'

const hashedId = await hashUserId('user123');
// Result: SHA-256 hash of user ID

// Update privacy configuration at runtime
analytics.updatePrivacyConfig({
  scrubUrls: false,
  hashUserIds: true
});

// Access privacy engine directly
const privacyEngine = analytics.getPrivacyEngine();
const config = privacyEngine.getConfig();
```

**Privacy Features:**
- Automatic URL scrubbing (query parameters: token, password, email, etc.)
- PII pattern detection (emails, phone numbers, SSNs, credit cards, IPs)
- Stack trace exclusion for error events
- User ID hashing (SHA-256)
- Configurable sensitive parameters
- GDPR/CCPA compliance support

## API Reference

See [main README](../../README.md) for full documentation.

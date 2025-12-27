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

### Structured Logging

```typescript
import { 
  Logger, 
  LogLevel, 
  ConsoleSink, 
  HttpSink,
  getLogger 
} from '@dap-overlay/sdk-core';

// Get global logger with console sink
const logger = getLogger({
  level: LogLevel.INFO,
  module: 'MyApp',
});

// Log messages at different levels
logger.debug('Debug message', { userId: '123' });
logger.info('Info message', { action: 'user_login' });
logger.warn('Warning message', { threshold: 0.9 });
logger.error('Error occurred', new Error('Something failed'), { context: 'payment' });

// Create child logger with scoped module name
const childLogger = logger.child('Analytics');
childLogger.info('Event tracked'); // [MyApp:Analytics] Event tracked

// Add HTTP sink for log aggregation
const httpSink = new HttpSink('https://logs.example.com/api/logs', 10, 5000);
logger.addSink(httpSink);

// Change log level at runtime
logger.configure({ level: LogLevel.DEBUG });

// Create custom logger with multiple sinks
const customLogger = new Logger({
  level: LogLevel.WARN,
  module: 'Custom',
  sinks: [
    new ConsoleSink(),
    new HttpSink('https://logs.example.com/api/logs')
  ],
  traceId: 'abc-123-def'
});
```

**Log Levels:**
- `DEBUG (0)` - Detailed debugging information
- `INFO (1)` - General informational messages
- `WARN (2)` - Warning messages
- `ERROR (3)` - Error messages
- `SILENT (4)` - No logging

**Built-in Sinks:**
- `ConsoleSink` - Writes to browser console
- `HttpSink` - Batches and sends logs to HTTP endpoint

## API Reference

See [main README](../../README.md) for full documentation.

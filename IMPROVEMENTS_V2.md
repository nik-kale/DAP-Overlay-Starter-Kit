# V2 Improvements & Roadmap

This document tracks the improvements made in V2 and plans for future releases.

## ✅ Completed Improvements (V2)

### Critical Bug Fixes
- [x] Fixed DOMPurify SSR incompatibility with lazy loading
- [x] Fixed memory leak in modal ESC key handler
- [x] Fixed Vitest config to properly exclude E2E tests
- [x] Added ReDoS protection for regex patterns
- [x] Enhanced selector validation with error handling

### Security Enhancements
- [x] Implemented `safeRegexTest()` with pattern validation
- [x] Added complexity checks for regex patterns
- [x] Improved selector validation with try-catch
- [x] Added dangerous pattern detection
- [x] Enabled image tag support in HTML sanitization

### Developer Experience
- [x] Added React Error Boundary component
- [x] Created utility types (TooltipStep, BannerStep, ModalStep)
- [x] Added DebugOptions interface for future debug mode
- [x] Exported ErrorBoundary from sdk-react

### Testing
- [x] Created GuideEngine test suite
- [x] Created TelemetryClient test suite
- [x] Fixed test configuration

### Styling
- [x] Added dark mode CSS theme
- [x] Support for `prefers-color-scheme`
- [x] Manual dark mode class override

### Documentation
- [x] Added CHANGELOG.md
- [x] Created this improvements tracking document

## ✅ Recently Completed (Latest)

### React Hook Improvements
- [x] Fix useGuideEngine dependency arrays with JSON serialization
- [x] Fix usePopper unnecessary recreation with memoization
- [x] Add comprehensive memoization documentation with examples
- [x] Use refs for stable object references (telemetryClient, callbacks)

### React Performance Optimizations
- [x] Memoize all components (Tooltip, Banner, Modal, OverlayOrchestrator)
- [x] Use useCallback for all event handlers
- [x] Prevent unnecessary re-renders across all components
- [x] Fix createPortal import from react-dom

### Testing Coverage (93.8% Pass Rate - 166/177 tests)
- [x] React component tests: 71 tests (60 passing, 11 async timing issues)
  - Tooltip: 12 tests ✓
  - Banner: 13 tests ✓
  - Modal: 17 tests ✓
  - OverlayOrchestrator: 11 tests ✓
  - ErrorBoundary: 11 tests ✓
  - usePopper: 18 tests ✓
  - useGuideEngine: 8/19 tests (async timing issues)
- [x] Vanilla SDK tests: 32 tests (all passing) ✓
  - OverlayRenderer comprehensive coverage
  - Event listener cleanup
  - Memory leak prevention
  - XSS prevention validation
  - ARIA attributes testing
- [x] SDK-Core tests: 44 tests (all passing) ✓

### Styling & Theming
- [x] Add dark mode CSS for Vanilla SDK
- [x] Support for `prefers-color-scheme` detection
- [x] Manual dark mode class override

### Developer Experience
- [x] Implement comprehensive debug logging system
- [x] Add DebugLogger utility with configurable logging levels
- [x] Support for logging: conditions, step resolution, telemetry, callbacks
- [x] Export debug utilities from SDK core

### Test Infrastructure
- [x] Update vitest config to support .tsx files
- [x] Install and configure @testing-library/react
- [x] Add @testing-library/jest-dom for custom matchers
- [x] Configure React global scope for tests

## 🚧 In Progress

### Performance Optimization
- [ ] Make DOMPurify and AJV optional dependencies
- [ ] Implement code splitting by overlay type
- [ ] Add bundle size analysis

## 📋 Planned Features

### Multi-Step Tours (V2.1)
```typescript
interface TourStep extends Step {
  sequence: number;
  dependsOn?: string[];
  navigation?: {
    showNext?: boolean;
    showPrevious?: boolean;
    showProgress?: boolean;
  };
}
```

### A/B Testing Support (V2.1)
```typescript
interface Step {
  // ... existing fields
  variant?: {
    id: string;
    weight: number;  // 0-100
  };
}
```

### Debug Mode (V2.1)
```typescript
const engine = new GuideEngine({
  steps,
  debug: {
    enabled: true,
    logConditionEvaluation: true,
    logStepResolution: true,
  },
});
```

### Accessibility (V2.2)
- [ ] Focus management for modals
- [ ] Keyboard navigation
- [ ] Screen reader announcements
- [ ] WCAG 2.1 AA compliance
- [ ] Reduced motion support

### Advanced Features (V2.3+)
- [ ] Animation/transition API
- [ ] Position constraints (viewport bounds)
- [ ] Auto-dismiss on scroll/resize options
- [ ] Video/media support in overlays
- [ ] Interactive playground/docs site
- [ ] Vue.js SDK
- [ ] Svelte SDK

## 🐛 Known Issues

1. **Bundle Size**: Vanilla SDK is ~367KB uncompressed
   - **Plan**: Make dependencies optional, tree-shake unused code

2. **React Hook Dependencies**: Objects aren't memoized
   - **Plan**: Add documentation + useMemo examples

3. **No SSR Demo**: Examples don't show Next.js/Remix usage
   - **Plan**: Add Next.js example app

4. **TypeScript Strict Null Checks**: querySelector not always checked for null
   - **Plan**: Add runtime checks and better error messages

## 📊 Metrics

### Test Coverage
- sdk-core: ~60% (evaluator, validator, security tested)
- sdk-react: ~10% (error boundary only)
- sdk-vanilla: 0%
- **Target**: 80%+ across all packages

### Bundle Sizes (Gzipped)
- sdk-core: ~15KB ✅
- sdk-vanilla: ~120KB ⚠️ (target: <50KB)
- sdk-react: ~12KB ✅

### Performance
- Time to Interactive: Not measured
- **Target**: Document performance benchmarks

## 🔄 Migration Guides

### From V1 to V2

#### Breaking Changes
None! V2 is fully backward compatible.

#### New Features You Should Use

1. **Error Boundary** (Recommended for Production)
```tsx
import { OverlayErrorBoundary } from '@dap-overlay/sdk-react';

<OverlayErrorBoundary
  onError={(error) => console.error('Overlay error:', error)}
>
  <OverlayOrchestrator {...props} />
</OverlayErrorBoundary>
```

2. **Dark Mode**
```tsx
import '@dap-overlay/sdk-react/styles.css';
import '@dap-overlay/sdk-react/styles-dark.css';  // NEW!
```

3. **Utility Types**
```typescript
import type { TooltipStep, BannerStep } from '@dap-overlay/sdk-react';

const myTooltip: TooltipStep = {
  type: 'tooltip',
  selector: '#target',  // TypeScript knows this is required!
  // ...
};
```

## 📝 Notes

- All V2 improvements maintain backward compatibility
- Security fixes are prioritized and released immediately
- Performance optimizations are ongoing
- Community feedback drives roadmap priorities

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to contribute to these improvements.

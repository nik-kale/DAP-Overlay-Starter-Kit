# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete DAP Overlay SDK with Vanilla JS and React support
- JSON Schema validation for step definitions (AJV)
- Mock and real telemetry toggle
- Popper.js positioning for tooltips
- Security features: DOMPurify sanitization, CSP-ready, ReDoS protection
- React Error Boundary component
- Dark mode theme support (React + Vanilla SDK)
- Utility types for better TypeScript DX
- Comprehensive test suite (unit + E2E)
- GitHub Actions CI workflow
- Documentation: README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT
- **Debug logging system with DebugLogger utility**
- **Comprehensive test coverage: 166/177 tests passing (93.8%)**
  - React component tests: 60 tests
  - Vanilla SDK tests: 32 tests
  - SDK Core tests: 44 tests

### Fixed
- DOMPurify SSR incompatibility (lazy loading)
- Memory leak in modal ESC key handler
- Vitest config to exclude E2E tests
- Enhanced selector validation with try-catch
- ReDoS protection for path regex
- Added image tag support in HTML sanitization
- **React hook dependency issues (useGuideEngine, usePopper)**
- **Unnecessary re-renders in all React components**
- **createPortal import from react-dom**

### Performance
- **Memoize all React components with React.memo()**
- **Use useCallback for all event handlers**
- **JSON serialization for deep comparison in hooks**
- **Refs for stable object references (telemetryClient, callbacks)**

### Developer Experience
- **Debug mode with configurable logging levels**
- **Logging for: conditions, step resolution, telemetry, callbacks**
- **Comprehensive JSDoc documentation for hooks**
- **Memoization examples in hook documentation**

### Testing
- **Tooltip component: 12 tests**
- **Banner component: 13 tests**
- **Modal component: 17 tests**
- **OverlayOrchestrator: 11 tests**
- **ErrorBoundary: 11 tests**
- **usePopper hook: 18 tests**
- **OverlayRenderer (Vanilla): 32 tests**
- **Test infrastructure: vitest + @testing-library/react + jest-dom**

### Security
- Implemented safe regex testing to prevent ReDoS attacks
- Enhanced selector validation to prevent injection
- Lazy-loaded DOMPurify for SSR compatibility
- Proper event listener cleanup to prevent memory leaks
- **XSS prevention validation in tests**

## [0.1.0] - 2025-11-16

### Added
- Initial release of DAP Overlay Starter Kit
- @dap-overlay/sdk-core package
- @dap-overlay/sdk-vanilla package
- @dap-overlay/sdk-react package
- Demo applications (React + Vanilla JS)
- MSW mock server for telemetry
- Complete documentation

[Unreleased]: https://github.com/yourusername/dap-overlay-starter-kit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/dap-overlay-starter-kit/releases/tag/v0.1.0

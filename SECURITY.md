# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. DO NOT Create a Public Issue

Please do not report security vulnerabilities through public GitHub issues.

### 2. Report Privately

Send a detailed report to: **security@example.com** (replace with actual email)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Wait for Response

We will:
- Acknowledge receipt within 48 hours
- Provide an initial assessment within 7 days
- Keep you updated on progress
- Credit you in the security advisory (unless you prefer anonymity)

## Security Considerations

### Content Security Policy (CSP)

This SDK is designed to work with CSP. Recommended headers:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
```

**Note**: Popper.js requires inline styles for positioning. For stricter CSP:
- Use `style-src-attr 'unsafe-inline'` instead of `style-src 'unsafe-inline'`
- Or implement nonce-based approach

### XSS Prevention

The SDK uses multiple layers of XSS protection:

1. **No `eval()`**: Safe predicate DSL instead of arbitrary JavaScript
2. **DOMPurify**: All HTML content sanitized
3. **Selector Validation**: CSS selectors checked for dangerous patterns
4. **Type Safety**: TypeScript prevents injection bugs

### Safe HTML Content

When using `allowHtml: true`:

```json
{
  "content": {
    "body": "<p>Safe HTML only</p>",
    "allowHtml": true
  }
}
```

DOMPurify configuration:
- Allowed tags: `p`, `br`, `strong`, `em`, `u`, `a`, `ul`, `ol`, `li`, `span`, `div`, `h1-h6`, `code`, `pre`
- Allowed attributes: `href`, `target`, `rel`, `class`
- No data attributes
- No event handlers
- No script tags

### Telemetry Security

**Mock Mode** (Development):
- Local-only, no network requests
- Safe for testing with sensitive data

**Real Mode** (Production):
- Use HTTPS endpoints only
- Implement authentication/authorization
- Validate all inputs server-side
- Rate limit API calls

### Sandboxing (Optional)

For maximum isolation, render overlays in a sandboxed iframe:

```html
<iframe
  sandbox="allow-scripts allow-same-origin"
  srcdoc="<!-- overlay content -->"
></iframe>
```

**Trade-offs**:
- ✅ Stronger isolation
- ❌ More complex integration
- ❌ Positioning challenges

### Dependency Security

We monitor dependencies for vulnerabilities:

```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update
```

Key dependencies:
- `@popperjs/core`: Positioning (no DOM manipulation)
- `dompurify`: HTML sanitization (security-focused)
- `ajv`: JSON validation (schema enforcement)

### Secrets Management

**NEVER** commit:
- API keys
- Authentication tokens
- Private keys
- `.env` files with secrets

Use environment variables:
```bash
# .env (gitignored)
VITE_API_BASE_URL=https://api.example.com
VITE_API_KEY=your-key-here
```

### Validation

All external inputs are validated:

1. **Step Definitions**: AJV JSON Schema validation
2. **Telemetry Context**: Type checking
3. **CSS Selectors**: Pattern validation
4. **HTML Content**: DOMPurify sanitization

### Best Practices for Consumers

If you're using this SDK:

1. **Validate Step Definitions**: Don't trust external step sources
2. **Sanitize Dynamic Content**: Even with `allowHtml: false`
3. **Review Callbacks**: Ensure callback functions are safe
4. **Monitor Telemetry**: Watch for unusual patterns
5. **Update Regularly**: Keep SDK version current

### Known Limitations

1. **Inline Styles**: Required for Popper.js positioning
2. **DOM Access**: SDK needs access to host DOM
3. **Event Handlers**: Attached dynamically (can't use strict CSP without modification)

### Security Checklist for Production

- [ ] Use HTTPS for all API calls
- [ ] Implement CSP headers
- [ ] Enable authentication/authorization
- [ ] Rate limit telemetry endpoints
- [ ] Monitor for XSS attempts
- [ ] Review step definitions before deployment
- [ ] Audit dependencies regularly
- [ ] Keep SDK updated
- [ ] Test with security scanners
- [ ] Implement error boundaries

## Attribution

If you report a vulnerability, we will:
- Credit you in the security advisory
- Add you to SECURITY_CONTRIBUTORS.md
- Respect your preference for anonymity

## Security Updates

Security patches are released ASAP with:
- Detailed advisory
- Migration guide (if breaking)
- CVE number (for serious issues)

Subscribe to releases to stay informed.

---

# V2-V5 Features Security Review

## Audit Summary (2025-01-17)

**Features Reviewed:** V2 (Analytics), V3 (Segmentation & i18n), V4 (Flows), V5 (Experiments)
**Audit Tool:** pnpm audit
**Status:** ✅ Production Ready

### Vulnerability Scan Results

- **Total Issues:** 1 (dev dependency only)
- **Production Code:** 0 vulnerabilities
- **Recommendation:** Safe for production deployment

## New Security Features

### V2 Analytics - Rate Limiting

Protection against API abuse and DoS attacks:

```typescript
// Token bucket algorithm
const analytics = new AnalyticsEngine({
  enableRateLimit: true,
  maxEventsPerSecond: 50, // Configurable limit
});
```

### V2 Analytics - Retry with Exponential Backoff

Prevents thundering herd problems:

```typescript
// Automatic retry with backoff
const analytics = new AnalyticsEngine({
  enableRetry: true,
  maxRetries: 3,
  baseDelay: 1000, // 1s, 2s, 4s backoff
});
```

### V3 Segmentation - Privacy by Default

No PII required:

```typescript
// Use role/plan attributes instead of email/name
segmentation.setUserProfile(userId, {
  user: {
    userId: hashUserId(userId), // Hash user IDs
    role: 'admin',
    plan: 'enterprise',
    // NO: email, name, phone
  },
});
```

### V5 Experiments - Deterministic Assignment

Prevents assignment manipulation:

```typescript
// Server-side validation recommended
const assignment = experiments.assignVariant('test-id', userId);
// Verify assignment server-side before trusting client
```

## Security Best Practices for V2-V5

### Analytics Data Collection

1. **Minimize PII:** Only collect necessary data
2. **Hash User IDs:** Use hashed identifiers
3. **Server Validation:** Validate all events server-side
4. **Rate Limiting:** Enforce server-side limits
5. **Encryption:** Use HTTPS for all API calls

### Segmentation & Targeting

1. **No Sensitive Data:** Don't segment on PII
2. **Server-Side Logic:** Critical targeting on server
3. **Audit Segments:** Review segment definitions regularly
4. **Access Control:** Protect segment configuration

### Flow State Management

1. **Client-Side Only:** Don't trust flow state for authorization
2. **Server Validation:** Verify completion server-side
3. **Timeout Enforcement:** Limit flow duration
4. **Progress Storage:** Use secure session storage

### A/B Testing Security

1. **Server Assignment:** Assign variants server-side for critical tests
2. **Validate Results:** Don't trust client-reported conversions
3. **Audit Experiments:** Review experiment configs
4. **Privacy Compliance:** Obtain user consent

## Production Deployment Checklist

### V2 Analytics

- [ ] Configure server-side rate limiting
- [ ] Implement API authentication
- [ ] Set up event validation endpoints
- [ ] Enable retry logic in production
- [ ] Monitor for unusual event patterns

### V3 Segmentation

- [ ] Review all segment definitions
- [ ] Ensure no PII in attributes
- [ ] Implement server-side targeting validation
- [ ] Set up cohort access controls
- [ ] Audit translation files for security

### V4 Flows

- [ ] Validate flow definitions
- [ ] Implement server-side progress verification
- [ ] Set appropriate timeouts
- [ ] Review branching logic for exploits
- [ ] Test flow completion tracking

### V5 Experiments

- [ ] Validate experiment configurations
- [ ] Implement server-side assignment
- [ ] Protect goal tracking endpoints
- [ ] Review statistical analysis
- [ ] Monitor for experiment manipulation

## Compliance Considerations

### GDPR (Europe)

- [ ] Obtain consent for analytics tracking
- [ ] Provide data export functionality (✅ Implemented)
- [ ] Implement data deletion (✅ Implemented via clearData())
- [ ] Document data processing activities
- [ ] Implement "Do Not Track" support

### CCPA (California)

- [ ] Disclose data collection practices
- [ ] Provide opt-out mechanism
- [ ] Honor user privacy requests
- [ ] Maintain data inventory

### HIPAA (Healthcare)

- ⚠️ **Not HIPAA Compliant:** Do not use for PHI without additional safeguards
- Implement encryption at rest
- Add audit logging
- Use HIPAA-compliant hosting

## Security Contact

For security issues related to V2-V5 features, contact: **security@example.com**

Include:
- Feature version (V2, V3, V4, or V5)
- Affected component (Analytics, Segmentation, Flows, Experiments)
- Detailed reproduction steps
- Potential impact assessment

**Response SLA:** 24 hours for critical issues, 72 hours for others

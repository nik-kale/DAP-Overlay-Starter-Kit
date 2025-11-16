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

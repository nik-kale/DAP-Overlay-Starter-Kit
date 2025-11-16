# Contributing to DAP Overlay Starter Kit

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dap-overlay-starter-kit.git
   cd dap-overlay-starter-kit
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @dap-overlay/sdk-core build

# Watch mode
pnpm --filter @dap-overlay/sdk-core dev
```

### Testing

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm e2e

# Run with coverage
pnpm test -- --coverage
```

### Code Quality

Before submitting a PR, ensure:

```bash
# Linting passes
pnpm lint

# Types are correct
pnpm typecheck

# Code is formatted
pnpm format

# Tests pass
pnpm test
pnpm e2e
```

## Coding Standards

### TypeScript

- Use strict TypeScript - no `any` without justification
- Export types alongside implementations
- Document complex types with JSDoc comments
- Prefer interfaces over type aliases for object shapes

### Naming Conventions

- **Files**: kebab-case (`my-component.tsx`)
- **Components**: PascalCase (`MyComponent`)
- **Functions**: camelCase (`handleClick`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`UserContext`)

### Code Style

- Use functional components and hooks (React)
- Avoid default exports (except for demo apps)
- Keep functions small and single-purpose
- Add comments for complex logic
- Write self-documenting code

### Security

- Never use `eval()` or `Function()` constructor
- Sanitize all user-provided HTML with DOMPurify
- Validate all external inputs
- Follow principle of least privilege
- No secrets in code or tests

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(sdk-react): add useGuideEngine hook

Implement useGuideEngine hook that wraps GuideEngine
and provides React-friendly API for managing overlay state.

Closes #123
```

```
fix(sdk-core): prevent XSS in content sanitization

Update sanitizeHtml to use stricter DOMPurify config
that blocks all script-like content.

Fixes #456
```

## Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md (if applicable)
5. Request review from maintainers

### PR Title Format

Use the same format as commit messages:
```
feat(sdk-react): add tooltip component
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Motivation
Why are these changes needed?

## Changes
- Change 1
- Change 2

## Testing
How were these changes tested?

## Screenshots (if applicable)

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Follows code style guidelines
```

## Adding New Features

### New Step Type

1. Update JSON schema in `schemas/steps.schema.json`
2. Add type to `packages/sdk-core/src/types.ts`
3. Implement renderer in both SDKs:
   - `packages/sdk-vanilla/src/renderer.ts`
   - `packages/sdk-react/src/components/`
4. Add tests
5. Update documentation

### New Condition Operator

1. Add operator to `PredicateOp` in `types.ts`
2. Implement in `packages/sdk-core/src/evaluator.ts`
3. Update schema
4. Add tests
5. Document in README

## Testing Guidelines

### Unit Tests

- Test edge cases and error conditions
- Mock external dependencies
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

Example:
```typescript
describe('evaluateConditions', () => {
  it('should match when errorId matches (string)', () => {
    // Arrange
    const conditions = { errorId: 'AUTH_401' };
    const context = { telemetry: { errorId: 'AUTH_401' }, route: { path: '/' } };

    // Act
    const result = evaluateConditions(conditions, context);

    // Assert
    expect(result).toBe(true);
  });
});
```

### E2E Tests

- Test user flows, not implementation details
- Use realistic scenarios
- Keep tests independent
- Clean up after tests

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include code examples
- Document breaking changes

## Questions?

- Open an issue for discussion
- Join our community chat (if available)
- Email maintainers

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

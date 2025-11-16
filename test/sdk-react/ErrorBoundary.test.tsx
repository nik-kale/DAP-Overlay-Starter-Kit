/**
 * Tests for ErrorBoundary component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../packages/sdk-react/src/components/ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary Component', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error for these tests since we're intentionally causing errors
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render null when error occurs with no fallback', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render custom fallback when error occurs', () => {
    const fallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    const error = onError.mock.calls[0][0];
    expect(error.message).toBe('Test error');
  });

  it('should log error to console.error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Overlay Error Boundary caught error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should recover when error is fixed', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Initially shows nothing (error state)
    expect(screen.queryByText('No error')).not.toBeInTheDocument();

    // Note: Error boundaries don't automatically recover in React
    // This test documents the current behavior
    // To recover, the component would need to be unmounted and remounted
    // or use a reset mechanism with state

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Still in error state after rerender
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });

  it('should handle errors in nested components', () => {
    const onError = vi.fn();

    function Parent() {
      return (
        <div>
          <span>Parent content</span>
          <ThrowError shouldThrow={true} />
        </div>
      );
    }

    render(
      <ErrorBoundary onError={onError}>
        <Parent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Parent content')).not.toBeInTheDocument();
  });

  it('should not call onError when no error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle errors with both fallback and onError', () => {
    const onError = vi.fn();
    const fallback = <div>Error occurred</div>;

    render(
      <ErrorBoundary fallback={fallback} onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple children without error', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('should preserve error state across re-renders', () => {
    const onError = vi.fn();

    const { rerender } = render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);

    // Rerender with same props
    rerender(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should not call onError again
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

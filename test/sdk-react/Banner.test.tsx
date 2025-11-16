/**
 * Tests for Banner component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { Banner } from '../../packages/sdk-react/src/components/Banner';
import type { Step } from '@dap-overlay/sdk-core';

describe('Banner Component', () => {
  let mockStep: Step;
  let mockOnDismiss: ReturnType<typeof vi.fn>;
  let mockOnCtaClick: ReturnType<typeof vi.fn>;
  let mockOnShow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStep = {
      id: 'banner-1',
      type: 'banner',
      content: {
        title: 'Test Banner',
        body: 'This is a test banner message',
      },
      actions: {
        cta: {
          label: 'Learn More',
          callbackId: 'test-callback',
        },
      },
    };

    mockOnDismiss = vi.fn();
    mockOnCtaClick = vi.fn();
    mockOnShow = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render banner with title and body', () => {
    render(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(screen.getByText('Test Banner')).toBeInTheDocument();
    expect(screen.getByText('This is a test banner message')).toBeInTheDocument();
  });

  it('should render CTA button when actions.cta is provided', () => {
    render(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const ctaButton = screen.getByText('Learn More');
    expect(ctaButton).toBeInTheDocument();
  });

  it('should call onDismiss when close button is clicked', () => {
    render(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledWith(mockStep);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should call onCtaClick when CTA button is clicked', () => {
    render(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const ctaButton = screen.getByText('Learn More');
    fireEvent.click(ctaButton);

    expect(mockOnCtaClick).toHaveBeenCalledWith(mockStep);
    expect(mockOnCtaClick).toHaveBeenCalledTimes(1);
  });

  it('should call onShow when component mounts', () => {
    render(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(mockOnShow).toHaveBeenCalledWith(mockStep);
    expect(mockOnShow).toHaveBeenCalledTimes(1);
  });

  it('should render without title when title is not provided', () => {
    const stepWithoutTitle = { ...mockStep, content: { body: 'Body only' } };

    render(
      <Banner
        step={stepWithoutTitle}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Body only')).toBeInTheDocument();
  });

  it('should render without CTA when actions.cta is not provided', () => {
    const stepWithoutCta = { ...mockStep, actions: undefined };

    render(
      <Banner
        step={stepWithoutCta}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(screen.queryByRole('button', { name: /learn more/i })).not.toBeInTheDocument();
  });

  it('should render sanitized HTML when allowHtml is true', async () => {
    const stepWithHtml = {
      ...mockStep,
      content: {
        title: 'Test',
        body: '<em>Italic text</em>',
        allowHtml: true,
      },
    };

    render(
      <Banner
        step={stepWithHtml}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    // Wait for async HTML sanitization to complete
    await waitFor(() => {
      const emElement = screen.getByText('Italic text');
      expect(emElement.tagName).toBe('EM');
    });
  });

  it('should have correct ARIA attributes', () => {
    render(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveClass('dap-overlay-react--banner');
  });

  it('should always render close button', () => {
    render(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  it('should not call onShow multiple times on re-renders', () => {
    const { rerender } = render(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(mockOnShow).toHaveBeenCalledTimes(1);

    // Re-render with same step
    rerender(
      <Banner
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    // Should still be called only once since step.id hasn't changed
    expect(mockOnShow).toHaveBeenCalledTimes(1);
  });

  it('should handle missing onShow callback gracefully', () => {
    expect(() => {
      render(
        <Banner
          step={mockStep}
          onDismiss={mockOnDismiss}
          onCtaClick={mockOnCtaClick}
        />
      );
    }).not.toThrow();
  });

  it('should render plain text when allowHtml is false', () => {
    const stepWithHtml = {
      ...mockStep,
      content: {
        title: 'Test',
        body: '<script>alert("xss")</script>Normal text',
        allowHtml: false,
      },
    };

    render(
      <Banner
        step={stepWithHtml}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    // HTML should be rendered as plain text, not executed
    expect(screen.getByText(/<script>alert\("xss"\)<\/script>Normal text/)).toBeInTheDocument();
  });
});

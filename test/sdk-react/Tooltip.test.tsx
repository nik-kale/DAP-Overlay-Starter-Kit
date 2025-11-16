/**
 * Tests for Tooltip component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Tooltip } from '../../packages/sdk-react/src/components/Tooltip';
import type { Step } from '@dap-overlay/sdk-core';

describe('Tooltip Component', () => {
  let mockStep: Step;
  let mockOnDismiss: ReturnType<typeof vi.fn>;
  let mockOnCtaClick: ReturnType<typeof vi.fn>;
  let mockOnShow: ReturnType<typeof vi.fn>;
  let anchorElement: HTMLElement;

  beforeEach(() => {
    // Create anchor element for tooltip
    anchorElement = document.createElement('div');
    anchorElement.id = 'test-anchor';
    document.body.appendChild(anchorElement);

    mockStep = {
      id: 'tooltip-1',
      type: 'tooltip',
      selector: '#test-anchor',
      content: {
        title: 'Test Tooltip',
        body: 'This is a test tooltip body',
      },
      actions: {
        cta: {
          label: 'Got it',
          callbackId: 'test-callback',
        },
      },
      popper: {
        placement: 'top',
        offset: [0, 8],
        strategy: 'absolute',
      },
    };

    mockOnDismiss = vi.fn();
    mockOnCtaClick = vi.fn();
    mockOnShow = vi.fn();
  });

  afterEach(() => {
    cleanup();
    document.body.removeChild(anchorElement);
  });

  it('should render tooltip with title and body', () => {
    render(
      <Tooltip
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(screen.getByText('Test Tooltip')).toBeInTheDocument();
    expect(screen.getByText('This is a test tooltip body')).toBeInTheDocument();
  });

  it('should render CTA button when actions.cta is provided', () => {
    render(
      <Tooltip
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const ctaButton = screen.getByText('Got it');
    expect(ctaButton).toBeInTheDocument();
  });

  it('should call onDismiss when close button is clicked', () => {
    render(
      <Tooltip
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
      <Tooltip
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const ctaButton = screen.getByText('Got it');
    fireEvent.click(ctaButton);

    expect(mockOnCtaClick).toHaveBeenCalledWith(mockStep);
    expect(mockOnCtaClick).toHaveBeenCalledTimes(1);
  });

  it('should call onShow when component mounts', () => {
    render(
      <Tooltip
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
      <Tooltip
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
      <Tooltip
        step={stepWithoutCta}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(screen.queryByRole('button', { name: /got it/i })).not.toBeInTheDocument();
  });

  it('should not render when anchor element is not found', () => {
    const stepWithInvalidSelector = { ...mockStep, selector: '#nonexistent' };

    const { container } = render(
      <Tooltip
        step={stepWithInvalidSelector}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render sanitized HTML when allowHtml is true', () => {
    const stepWithHtml = {
      ...mockStep,
      content: {
        title: 'Test',
        body: '<strong>Bold text</strong>',
        allowHtml: true,
      },
    };

    render(
      <Tooltip
        step={stepWithHtml}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const strongElement = screen.getByText('Bold text');
    expect(strongElement.tagName).toBe('STRONG');
  });

  it('should have correct ARIA attributes', () => {
    render(
      <Tooltip
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-live', 'polite');
  });

  it('should warn when anchor element is not found', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stepWithInvalidSelector = { ...mockStep, selector: '#nonexistent' };

    render(
      <Tooltip
        step={stepWithInvalidSelector}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Anchor element not found for selector: #nonexistent'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should not call onShow multiple times on re-renders', () => {
    const { rerender } = render(
      <Tooltip
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(mockOnShow).toHaveBeenCalledTimes(1);

    // Re-render with same step
    rerender(
      <Tooltip
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    // Should still be called only once since step.id hasn't changed
    expect(mockOnShow).toHaveBeenCalledTimes(1);
  });
});

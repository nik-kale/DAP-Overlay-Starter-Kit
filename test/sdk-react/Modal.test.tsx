/**
 * Tests for Modal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal } from '../../packages/sdk-react/src/components/Modal';
import type { Step } from '@dap-overlay/sdk-core';

describe('Modal Component', () => {
  let mockStep: Step;
  let mockOnDismiss: ReturnType<typeof vi.fn>;
  let mockOnCtaClick: ReturnType<typeof vi.fn>;
  let mockOnShow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStep = {
      id: 'modal-1',
      type: 'modal',
      content: {
        title: 'Test Modal',
        body: 'This is a test modal message',
      },
      actions: {
        cta: {
          label: 'Confirm',
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

  it('should render modal with title and body', () => {
    render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('This is a test modal message')).toBeInTheDocument();
  });

  it('should render backdrop', () => {
    const { container } = render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const backdrop = container.querySelector('.dap-overlay-react-backdrop');
    expect(backdrop).toBeInTheDocument();
  });

  it('should render CTA button when actions.cta is provided', () => {
    render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const ctaButton = screen.getByText('Confirm');
    expect(ctaButton).toBeInTheDocument();
  });

  it('should call onDismiss when close button is clicked', () => {
    render(
      <Modal
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

  it('should call onDismiss when backdrop is clicked', () => {
    const { container } = render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const backdrop = container.querySelector('.dap-overlay-react-backdrop');
    fireEvent.click(backdrop!);

    expect(mockOnDismiss).toHaveBeenCalledWith(mockStep);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when Escape key is pressed', () => {
    render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnDismiss).toHaveBeenCalledWith(mockStep);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not call onDismiss when other keys are pressed', () => {
    render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('should call onCtaClick when CTA button is clicked', () => {
    render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const ctaButton = screen.getByText('Confirm');
    fireEvent.click(ctaButton);

    expect(mockOnCtaClick).toHaveBeenCalledWith(mockStep);
    expect(mockOnCtaClick).toHaveBeenCalledTimes(1);
  });

  it('should call onShow when component mounts', () => {
    render(
      <Modal
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
      <Modal
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
      <Modal
        step={stepWithoutCta}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
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
      <Modal
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
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveClass('dap-overlay-react--modal');
  });

  it('should remove ESC key listener when unmounted', () => {
    const { unmount } = render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    unmount();

    // Press ESC after unmount
    fireEvent.keyDown(document, { key: 'Escape' });

    // Should not call onDismiss since listener was removed
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('should not call onShow multiple times on re-renders', () => {
    const { rerender } = render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    expect(mockOnShow).toHaveBeenCalledTimes(1);

    // Re-render with same step
    rerender(
      <Modal
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
        <Modal
          step={mockStep}
          onDismiss={mockOnDismiss}
          onCtaClick={mockOnCtaClick}
        />
      );
    }).not.toThrow();
  });

  it('should backdrop have aria-hidden attribute', () => {
    const { container } = render(
      <Modal
        step={mockStep}
        onDismiss={mockOnDismiss}
        onCtaClick={mockOnCtaClick}
        onShow={mockOnShow}
      />
    );

    const backdrop = container.querySelector('.dap-overlay-react-backdrop');
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });
});

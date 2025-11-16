/**
 * Tests for OverlayOrchestrator component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { OverlayOrchestrator } from '../../packages/sdk-react/src/components/OverlayOrchestrator';
import type { Step } from '@dap-overlay/sdk-core';

describe('OverlayOrchestrator Component', () => {
  let mockOnStepShow: ReturnType<typeof vi.fn>;
  let mockOnStepDismiss: ReturnType<typeof vi.fn>;
  let mockOnCtaClick: ReturnType<typeof vi.fn>;
  let anchorElement: HTMLElement;

  beforeEach(() => {
    // Create anchor element for tooltips
    anchorElement = document.createElement('div');
    anchorElement.id = 'test-anchor';
    document.body.appendChild(anchorElement);

    mockOnStepShow = vi.fn();
    mockOnStepDismiss = vi.fn();
    mockOnCtaClick = vi.fn();
  });

  afterEach(() => {
    cleanup();
    if (document.body.contains(anchorElement)) {
      document.body.removeChild(anchorElement);
    }
  });

  it('should render no overlays when steps array is empty', () => {
    const { container } = render(
      <OverlayOrchestrator
        steps={[]}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    // Portal will be in document.body, not in container
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render a tooltip step', () => {
    const tooltipStep: Step = {
      id: 'tooltip-1',
      type: 'tooltip',
      selector: '#test-anchor',
      content: {
        title: 'Tooltip Title',
        body: 'Tooltip body',
      },
    };

    render(
      <OverlayOrchestrator
        steps={[tooltipStep]}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Tooltip Title')).toBeInTheDocument();
  });

  it('should render a banner step', () => {
    const bannerStep: Step = {
      id: 'banner-1',
      type: 'banner',
      content: {
        title: 'Banner Title',
        body: 'Banner body',
      },
    };

    render(
      <OverlayOrchestrator
        steps={[bannerStep]}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Banner Title')).toBeInTheDocument();
  });

  it('should render a modal step', () => {
    const modalStep: Step = {
      id: 'modal-1',
      type: 'modal',
      content: {
        title: 'Modal Title',
        body: 'Modal body',
      },
    };

    render(
      <OverlayOrchestrator
        steps={[modalStep]}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('should render multiple steps of different types', () => {
    const steps: Step[] = [
      {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#test-anchor',
        content: { title: 'Tooltip', body: 'Tooltip body' },
      },
      {
        id: 'banner-1',
        type: 'banner',
        content: { title: 'Banner', body: 'Banner body' },
      },
      {
        id: 'modal-1',
        type: 'modal',
        content: { title: 'Modal', body: 'Modal body' },
      },
    ];

    render(
      <OverlayOrchestrator
        steps={steps}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tooltip')).toBeInTheDocument();
    expect(screen.getByText('Banner')).toBeInTheDocument();
    expect(screen.getByText('Modal')).toBeInTheDocument();
  });

  it('should call onStepShow for each rendered step', () => {
    const steps: Step[] = [
      {
        id: 'banner-1',
        type: 'banner',
        content: { body: 'Banner 1' },
      },
      {
        id: 'banner-2',
        type: 'banner',
        content: { body: 'Banner 2' },
      },
    ];

    render(
      <OverlayOrchestrator
        steps={steps}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    expect(mockOnStepShow).toHaveBeenCalledTimes(2);
    expect(mockOnStepShow).toHaveBeenCalledWith(steps[0]);
    expect(mockOnStepShow).toHaveBeenCalledWith(steps[1]);
  });

  it('should pass callbacks to child components', () => {
    const step: Step = {
      id: 'banner-1',
      type: 'banner',
      content: { body: 'Test banner' },
    };

    render(
      <OverlayOrchestrator
        steps={[step]}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    // Verify the banner was rendered with the correct props by checking it exists
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(mockOnStepShow).toHaveBeenCalledWith(step);
  });

  it('should use step.id as key for React list rendering', () => {
    const steps: Step[] = [
      {
        id: 'unique-id-1',
        type: 'banner',
        content: { body: 'Banner 1' },
      },
      {
        id: 'unique-id-2',
        type: 'banner',
        content: { body: 'Banner 2' },
      },
    ];

    const { container } = render(
      <OverlayOrchestrator
        steps={steps}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    // Both banners should be rendered
    expect(screen.getByText('Banner 1')).toBeInTheDocument();
    expect(screen.getByText('Banner 2')).toBeInTheDocument();
  });

  it('should render steps in a portal to document.body', () => {
    const step: Step = {
      id: 'banner-1',
      type: 'banner',
      content: { body: 'Test banner' },
    };

    const { container } = render(
      <OverlayOrchestrator
        steps={[step]}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    // Portal content should not be in the component's container
    expect(container.querySelector('.dap-overlay-react')).not.toBeInTheDocument();

    // But should be in document.body
    const bannerInBody = document.body.querySelector('.dap-overlay-react--banner');
    expect(bannerInBody).toBeInTheDocument();
  });

  it('should warn for unknown step types', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const invalidStep = {
      id: 'invalid-1',
      type: 'unknown-type',
      content: { body: 'Invalid step' },
    } as unknown as Step;

    render(
      <OverlayOrchestrator
        steps={[invalidStep]}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown step type: unknown-type');

    consoleWarnSpy.mockRestore();
  });

  it('should update rendered steps when steps prop changes', () => {
    const initialSteps: Step[] = [
      {
        id: 'banner-1',
        type: 'banner',
        content: { body: 'Initial banner' },
      },
    ];

    const { rerender } = render(
      <OverlayOrchestrator
        steps={initialSteps}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    expect(screen.getByText('Initial banner')).toBeInTheDocument();

    const newSteps: Step[] = [
      {
        id: 'banner-2',
        type: 'banner',
        content: { body: 'Updated banner' },
      },
    ];

    rerender(
      <OverlayOrchestrator
        steps={newSteps}
        onStepShow={mockOnStepShow}
        onStepDismiss={mockOnStepDismiss}
        onCtaClick={mockOnCtaClick}
      />
    );

    expect(screen.queryByText('Initial banner')).not.toBeInTheDocument();
    expect(screen.getByText('Updated banner')).toBeInTheDocument();
  });
});

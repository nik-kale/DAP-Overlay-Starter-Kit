/**
 * Orchestrator component that renders the appropriate overlay components
 */

import { useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import type { Step } from '@dap-overlay/sdk-core';
import { Tooltip } from './Tooltip.js';
import { Banner } from './Banner.js';
import { Modal } from './Modal.js';

export interface OverlayOrchestratorProps {
  steps: Step[];
  onStepShow: (step: Step) => void;
  onStepDismiss: (step: Step) => void;
  onCtaClick: (step: Step) => void;
}

function OverlayOrchestratorComponent({
  steps,
  onStepShow,
  onStepDismiss,
  onCtaClick,
}: OverlayOrchestratorProps) {
  // Memoize renderStep to prevent recreation on every render
  const renderStep = useCallback(
    (step: Step) => {
      switch (step.type) {
        case 'tooltip':
          return (
            <Tooltip
              key={step.id}
              step={step}
              onDismiss={onStepDismiss}
              onCtaClick={onCtaClick}
              onShow={onStepShow}
            />
          );

        case 'banner':
          return (
            <Banner
              key={step.id}
              step={step}
              onDismiss={onStepDismiss}
              onCtaClick={onCtaClick}
              onShow={onStepShow}
            />
          );

        case 'modal':
          return (
            <Modal
              key={step.id}
              step={step}
              onDismiss={onStepDismiss}
              onCtaClick={onCtaClick}
              onShow={onStepShow}
            />
          );

        default:
          console.warn(`Unknown step type: ${(step as Step).type}`);
          return null;
      }
    },
    [onStepShow, onStepDismiss, onCtaClick]
  );

  return createPortal(<>{steps.map(renderStep)}</>, document.body);
}

// Memoize component to prevent re-renders when props haven't changed
export const OverlayOrchestrator = memo(OverlayOrchestratorComponent);

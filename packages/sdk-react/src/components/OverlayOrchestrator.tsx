/**
 * Orchestrator component that renders the appropriate overlay components
 */

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

export function OverlayOrchestrator({
  steps,
  onStepShow,
  onStepDismiss,
  onCtaClick,
}: OverlayOrchestratorProps) {
  const renderStep = (step: Step) => {
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
  };

  return createPortal(
    <>{steps.map(renderStep)}</>,
    document.body
  );
}

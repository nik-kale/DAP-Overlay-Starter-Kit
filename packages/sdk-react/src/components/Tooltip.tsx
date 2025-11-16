/**
 * Tooltip component with Popper.js positioning
 */

import { useEffect, useState } from 'react';
import type { Step } from '@dap-overlay/sdk-core';
import { sanitizeHtml } from '@dap-overlay/sdk-core';
import { usePopper } from '../hooks/usePopper.js';

export interface TooltipProps {
  step: Step;
  onDismiss: (step: Step) => void;
  onCtaClick: (step: Step) => void;
  onShow?: (step: Step) => void;
}

export function Tooltip({ step, onDismiss, onCtaClick, onShow }: TooltipProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const { setPopperElement, setArrowElement } = usePopper(anchorElement, {
    placement: step.popper?.placement,
    offset: step.popper?.offset,
    strategy: step.popper?.strategy,
  });

  // Find anchor element
  useEffect(() => {
    if (step.selector) {
      const element = document.querySelector(step.selector) as HTMLElement;
      setAnchorElement(element);

      if (!element) {
        console.warn(`Anchor element not found for selector: ${step.selector}`);
      }
    }
  }, [step.selector]);

  // Call onShow when mounted
  useEffect(() => {
    if (onShow) {
      onShow(step);
    }
  }, [step, onShow]);

  if (!anchorElement) {
    return null;
  }

  return (
    <div
      ref={setPopperElement}
      className="dap-overlay-react dap-overlay-react--tooltip"
      role="tooltip"
      aria-live="polite"
    >
      {step.content.title && (
        <div className="dap-overlay-react__header">
          <h3 className="dap-overlay-react__title">{step.content.title}</h3>
          <button
            className="dap-overlay-react__close"
            onClick={() => onDismiss(step)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      <div className="dap-overlay-react__body">
        {step.content.allowHtml ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(step.content.body) }} />
        ) : (
          <p>{step.content.body}</p>
        )}
      </div>

      {step.actions?.cta && (
        <div className="dap-overlay-react__footer">
          <button className="dap-overlay-react__cta" onClick={() => onCtaClick(step)}>
            {step.actions.cta.label}
          </button>
        </div>
      )}

      <div ref={setArrowElement} className="dap-overlay-react__arrow" data-popper-arrow />
    </div>
  );
}

/**
 * Tooltip component with Popper.js positioning
 */

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import type { Step } from '@dap-overlay/sdk-core';
import { usePopper } from '../hooks/usePopper.js';
import { useSanitizedHtml } from '../hooks/useSanitizedHtml.js';

export interface TooltipProps {
  step: Step;
  onDismiss: (step: Step) => void;
  onCtaClick: (step: Step) => void;
  onShow?: (step: Step) => void;
}

function TooltipComponent({ step, onDismiss, onCtaClick, onShow }: TooltipProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  // Sanitize HTML content if needed
  const sanitizedBody = useSanitizedHtml(
    step.content.body,
    step.content.allowHtml || false
  );

  // Memoize popper options to prevent recreation
  const popperOptions = useMemo(
    () => ({
      placement: step.popper?.placement,
      offset: step.popper?.offset,
      strategy: step.popper?.strategy,
    }),
    [step.popper?.placement, step.popper?.offset, step.popper?.strategy]
  );

  const { setPopperElement, setArrowElement } = usePopper(anchorElement, popperOptions);

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

  // Call onShow when mounted - only once per step.id
  useEffect(() => {
    if (onShow) {
      onShow(step);
    }
    // Only call when step.id changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleDismiss = useCallback(() => {
    onDismiss(step);
  }, [onDismiss, step]);

  const handleCtaClick = useCallback(() => {
    onCtaClick(step);
  }, [onCtaClick, step]);

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
            onClick={handleDismiss}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      <div className="dap-overlay-react__body">
        {step.content.allowHtml ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizedBody }} />
        ) : (
          <p>{step.content.body}</p>
        )}
      </div>

      {step.actions?.cta && (
        <div className="dap-overlay-react__footer">
          <button className="dap-overlay-react__cta" onClick={handleCtaClick}>
            {step.actions.cta.label}
          </button>
        </div>
      )}

      <div ref={setArrowElement} className="dap-overlay-react__arrow" data-popper-arrow />
    </div>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export const Tooltip = memo(TooltipComponent);

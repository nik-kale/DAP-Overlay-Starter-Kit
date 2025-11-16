/**
 * Banner component (fixed position at top)
 */

import { useEffect, useCallback, memo } from 'react';
import type { Step } from '@dap-overlay/sdk-core';
import { useSanitizedHtml } from '../hooks/useSanitizedHtml.js';

export interface BannerProps {
  step: Step;
  onDismiss: (step: Step) => void;
  onCtaClick: (step: Step) => void;
  onShow?: (step: Step) => void;
}

function BannerComponent({ step, onDismiss, onCtaClick, onShow }: BannerProps) {
  // Sanitize HTML content if needed
  const sanitizedBody = useSanitizedHtml(
    step.content.body,
    step.content.allowHtml || false
  );

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

  return (
    <div
      className="dap-overlay-react dap-overlay-react--banner"
      role="status"
      aria-live="polite"
      style={step.style ? { zIndex: step.style.zIndex, ...step.style } : undefined}
    >
      <div className="dap-overlay-react__header">
        {step.content.title && <h3 className="dap-overlay-react__title">{step.content.title}</h3>}
        <button
          className="dap-overlay-react__close"
          onClick={handleDismiss}
          aria-label="Close"
        >
          &times;
        </button>
      </div>

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
    </div>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export const Banner = memo(BannerComponent);

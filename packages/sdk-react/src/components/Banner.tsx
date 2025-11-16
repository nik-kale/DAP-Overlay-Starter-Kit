/**
 * Banner component (fixed position at top)
 */

import { useEffect } from 'react';
import type { Step } from '@dap-overlay/sdk-core';
import { sanitizeHtml } from '@dap-overlay/sdk-core';

export interface BannerProps {
  step: Step;
  onDismiss: (step: Step) => void;
  onCtaClick: (step: Step) => void;
  onShow?: (step: Step) => void;
}

export function Banner({ step, onDismiss, onCtaClick, onShow }: BannerProps) {
  // Call onShow when mounted
  useEffect(() => {
    if (onShow) {
      onShow(step);
    }
  }, [step, onShow]);

  return (
    <div className="dap-overlay-react dap-overlay-react--banner" role="status" aria-live="polite">
      <div className="dap-overlay-react__header">
        {step.content.title && <h3 className="dap-overlay-react__title">{step.content.title}</h3>}
        <button
          className="dap-overlay-react__close"
          onClick={() => onDismiss(step)}
          aria-label="Close"
        >
          &times;
        </button>
      </div>

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
    </div>
  );
}

/**
 * Modal component (centered with backdrop)
 */

import { useEffect } from 'react';
import type { Step } from '@dap-overlay/sdk-core';
import { sanitizeHtml } from '@dap-overlay/sdk-core';

export interface ModalProps {
  step: Step;
  onDismiss: (step: Step) => void;
  onCtaClick: (step: Step) => void;
  onShow?: (step: Step) => void;
}

export function Modal({ step, onDismiss, onCtaClick, onShow }: ModalProps) {
  // Call onShow when mounted
  useEffect(() => {
    if (onShow) {
      onShow(step);
    }
  }, [step, onShow]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss(step);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [step, onDismiss]);

  return (
    <>
      <div
        className="dap-overlay-react-backdrop"
        onClick={() => onDismiss(step)}
        aria-hidden="true"
      />
      <div className="dap-overlay-react dap-overlay-react--modal" role="dialog" aria-modal="true">
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
    </>
  );
}

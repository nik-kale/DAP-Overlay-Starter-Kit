/**
 * Modal component (centered with backdrop)
 */

import { useEffect, useCallback, memo } from 'react';
import type { Step } from '@dap-overlay/sdk-core';
import { sanitizeHtml } from '@dap-overlay/sdk-core';

export interface ModalProps {
  step: Step;
  onDismiss: (step: Step) => void;
  onCtaClick: (step: Step) => void;
  onShow?: (step: Step) => void;
}

function ModalComponent({ step, onDismiss, onCtaClick, onShow }: ModalProps) {
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

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [handleDismiss]);

  return (
    <>
      <div
        className="dap-overlay-react-backdrop"
        onClick={handleDismiss}
        aria-hidden="true"
      />
      <div className="dap-overlay-react dap-overlay-react--modal" role="dialog" aria-modal="true">
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
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(step.content.body) }} />
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
    </>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export const Modal = memo(ModalComponent);

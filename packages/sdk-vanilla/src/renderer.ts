/**
 * DOM renderer for overlay elements
 */

import { createPopper, type Instance as PopperInstance } from '@popperjs/core';
import type { Step } from '@dap-overlay/sdk-core';
import { sanitizeHtml, validateSelector } from '@dap-overlay/sdk-core';

export interface RendererCallbacks {
  onDismiss: (stepId: string) => void;
  onCtaClick: (stepId: string) => void;
}

export class OverlayRenderer {
  private popperInstances: Map<string, PopperInstance> = new Map();
  private overlayElements: Map<string, HTMLElement> = new Map();
  private eventListeners: Map<string, Array<{ element: EventTarget; type: string; handler: EventListener }>> = new Map();
  private callbacks: RendererCallbacks;

  constructor(callbacks: RendererCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Render a step as an overlay
   */
  async render(step: Step): Promise<void> {
    // Remove existing overlay if it exists
    this.destroy(step.id);

    const overlay = await this.createElement(step);
    this.overlayElements.set(step.id, overlay);

    if (step.type === 'tooltip' && step.selector) {
      this.renderTooltip(step, overlay);
    } else if (step.type === 'banner') {
      this.renderBanner(overlay);
    } else if (step.type === 'modal') {
      this.renderModal(overlay);
    }
  }

  /**
   * Create the overlay DOM element
   */
  private async createElement(step: Step): Promise<HTMLElement> {
    const overlay = document.createElement('div');
    overlay.className = `dap-overlay dap-overlay--${step.type}`;
    overlay.setAttribute('data-step-id', step.id);
    overlay.setAttribute('role', step.type === 'modal' ? 'dialog' : 'tooltip');
    overlay.setAttribute('aria-live', 'polite');

    // Apply custom styles if provided
    if (step.style) {
      if (step.style.zIndex !== undefined) {
        overlay.style.zIndex = String(step.style.zIndex);
      }
      // Apply other custom styles
      Object.keys(step.style).forEach((key) => {
        if (key !== 'zIndex' && step.style![key] !== undefined) {
          (overlay.style as any)[key] = step.style![key];
        }
      });
    }

    // Build content
    const contentHtml = await this.buildContent(step);
    overlay.innerHTML = contentHtml;

    // Attach event listeners
    this.attachEventListeners(overlay, step);

    return overlay;
  }

  /**
   * Build the HTML content for an overlay
   */
  private async buildContent(step: Step): Promise<string> {
    const { content, actions } = step;

    let html = '';

    // Header
    if (content.title || step.type !== 'tooltip') {
      html += '<div class="dap-overlay__header">';
      if (content.title) {
        html += `<h3 class="dap-overlay__title">${this.escapeHtml(content.title)}</h3>`;
      }
      html += '<button class="dap-overlay__close" aria-label="Close">&times;</button>';
      html += '</div>';
    }

    // Body
    html += '<div class="dap-overlay__body">';
    if (content.allowHtml) {
      html += await sanitizeHtml(content.body);
    } else {
      html += `<p>${this.escapeHtml(content.body)}</p>`;
    }
    html += '</div>';

    // Footer (CTA)
    if (actions?.cta) {
      html += '<div class="dap-overlay__footer">';
      html += `<button class="dap-overlay__cta">${this.escapeHtml(actions.cta.label)}</button>`;
      html += '</div>';
    }

    // Arrow for tooltips
    if (step.type === 'tooltip') {
      html += '<div class="dap-overlay__arrow" data-popper-arrow></div>';
    }

    return html;
  }

  /**
   * Attach event listeners to overlay element
   */
  private attachEventListeners(overlay: HTMLElement, step: Step): void {
    const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

    // Close button
    const closeBtn = overlay.querySelector('.dap-overlay__close');
    if (closeBtn) {
      const handler = () => {
        this.callbacks.onDismiss(step.id);
      };
      closeBtn.addEventListener('click', handler);
      listeners.push({ element: closeBtn, type: 'click', handler });
    }

    // CTA button
    const ctaBtn = overlay.querySelector('.dap-overlay__cta');
    if (ctaBtn) {
      const handler = () => {
        this.callbacks.onCtaClick(step.id);
      };
      ctaBtn.addEventListener('click', handler);
      listeners.push({ element: ctaBtn, type: 'click', handler });
    }

    // ESC key and focus trap for modals (WCAG 2.1 compliance)
    if (step.type === 'modal') {
      // ESC key handler (listens on document)
      const handleEsc = (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Escape') {
          this.callbacks.onDismiss(step.id);
        }
      };
      document.addEventListener('keydown', handleEsc);
      listeners.push({ element: document, type: 'keydown', handler: handleEsc });

      // Tab key handler for focus trap (listens on overlay)
      const handleTab = (e: Event) => {
        const keyEvent = e as KeyboardEvent;

        // Only handle Tab key
        if (keyEvent.key !== 'Tab') {
          return;
        }

        const focusableElements = overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (keyEvent.shiftKey) {
          // Shift + Tab: move backwards
          if (document.activeElement === firstElement) {
            keyEvent.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move forwards
          if (document.activeElement === lastElement) {
            keyEvent.preventDefault();
            firstElement.focus();
          }
        }
      };

      overlay.addEventListener('keydown', handleTab);
      listeners.push({ element: overlay, type: 'keydown', handler: handleTab });

      // Focus first focusable element
      const focusableElements = overlay.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => focusableElements[0].focus(), 0);
      }
    }

    // Store all listeners for cleanup
    this.eventListeners.set(step.id, listeners);
  }

  /**
   * Render a tooltip with Popper.js positioning
   */
  private renderTooltip(step: Step, overlay: HTMLElement): void {
    if (!step.selector || !validateSelector(step.selector)) {
      console.error(`Invalid selector for tooltip step ${step.id}`);
      return;
    }

    const anchorElement = document.querySelector(step.selector);
    if (!anchorElement) {
      console.warn(`Anchor element not found for selector: ${step.selector}`);
      return;
    }

    document.body.appendChild(overlay);

    const popperOptions = step.popper || {};
    const popper = createPopper(anchorElement as HTMLElement, overlay, {
      placement: popperOptions.placement || 'auto',
      strategy: popperOptions.strategy || 'absolute',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: popperOptions.offset || [0, 8],
          },
        },
        {
          name: 'arrow',
          options: {
            padding: 8,
          },
        },
      ],
    });

    this.popperInstances.set(step.id, popper);
  }

  /**
   * Render a banner (fixed at top)
   */
  private renderBanner(overlay: HTMLElement): void {
    document.body.appendChild(overlay);
  }

  /**
   * Render a modal (centered with backdrop)
   */
  private renderModal(overlay: HTMLElement): void {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'dap-overlay-backdrop';
    backdrop.setAttribute('data-step-id', overlay.getAttribute('data-step-id') || '');

    backdrop.addEventListener('click', () => {
      const stepId = overlay.getAttribute('data-step-id');
      if (stepId) {
        this.callbacks.onDismiss(stepId);
      }
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(overlay);

    // Store backdrop reference
    this.overlayElements.set(`${overlay.getAttribute('data-step-id')}-backdrop`, backdrop);
  }

  /**
   * Destroy/remove an overlay
   */
  destroy(stepId: string): void {
    // Remove event listeners first to prevent memory leaks
    const listeners = this.eventListeners.get(stepId);
    if (listeners) {
      listeners.forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler);
      });
      this.eventListeners.delete(stepId);
    }

    // Destroy Popper instance
    const popper = this.popperInstances.get(stepId);
    if (popper) {
      popper.destroy();
      this.popperInstances.delete(stepId);
    }

    // Remove overlay element
    const overlay = this.overlayElements.get(stepId);
    if (overlay) {
      overlay.remove();
      this.overlayElements.delete(stepId);
    }

    // Remove backdrop if it exists
    const backdrop = this.overlayElements.get(`${stepId}-backdrop`);
    if (backdrop) {
      backdrop.remove();
      this.overlayElements.delete(`${stepId}-backdrop`);
    }
  }

  /**
   * Destroy all overlays
   */
  destroyAll(): void {
    for (const stepId of this.overlayElements.keys()) {
      if (!stepId.endsWith('-backdrop')) {
        this.destroy(stepId);
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

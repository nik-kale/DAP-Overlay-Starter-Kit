/**
 * Tests for OverlayRenderer class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OverlayRenderer, type RendererCallbacks } from '../../packages/sdk-vanilla/src/renderer';
import type { Step } from '../../packages/sdk-core/src/types';

describe('OverlayRenderer', () => {
  let renderer: OverlayRenderer;
  let mockCallbacks: RendererCallbacks;
  let anchorElement: HTMLElement;

  beforeEach(() => {
    mockCallbacks = {
      onDismiss: vi.fn(),
      onCtaClick: vi.fn(),
    };

    renderer = new OverlayRenderer(mockCallbacks);

    // Create an anchor element for tooltip tests
    anchorElement = document.createElement('div');
    anchorElement.id = 'test-anchor';
    document.body.appendChild(anchorElement);
  });

  afterEach(() => {
    renderer.destroyAll();
    if (document.body.contains(anchorElement)) {
      document.body.removeChild(anchorElement);
    }
    // Clean up any remaining overlays
    document.querySelectorAll('[data-step-id]').forEach((el) => el.remove());
  });

  describe('Construction', () => {
    it('should create renderer with callbacks', () => {
      expect(renderer).toBeInstanceOf(OverlayRenderer);
    });
  });

  describe('Tooltip rendering', () => {
    it('should render tooltip with valid selector', () => {
      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#test-anchor',
        content: {
          title: 'Test Tooltip',
          body: 'Tooltip content',
        },
      };

      renderer.render(step);

      const overlay = document.querySelector('[data-step-id="tooltip-1"]');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('dap-overlay--tooltip');
    });

    it('should render tooltip content correctly', () => {
      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#test-anchor',
        content: {
          title: 'My Title',
          body: 'My Body',
        },
      };

      renderer.render(step);

      expect(document.querySelector('.dap-overlay__title')).toHaveTextContent('My Title');
      expect(document.querySelector('.dap-overlay__body')).toHaveTextContent('My Body');
    });

    it('should render tooltip with CTA button', () => {
      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#test-anchor',
        content: {
          body: 'Test',
        },
        actions: {
          cta: {
            label: 'Click me',
            callbackId: 'test',
          },
        },
      };

      renderer.render(step);

      const ctaButton = document.querySelector('.dap-overlay__cta');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveTextContent('Click me');
    });

    it('should not render tooltip with invalid selector', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '<script>alert("xss")</script>',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should warn when anchor element not found', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#nonexistent',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Anchor element not found for selector: #nonexistent');
      consoleWarnSpy.mockRestore();
    });

    it('should render tooltip with sanitized HTML', () => {
      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#test-anchor',
        content: {
          body: '<strong>Bold text</strong>',
          allowHtml: true,
        },
      };

      renderer.render(step);

      const strongElement = document.querySelector('.dap-overlay__body strong');
      expect(strongElement).toBeInTheDocument();
      expect(strongElement).toHaveTextContent('Bold text');
    });

    it('should escape HTML when allowHtml is false', () => {
      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#test-anchor',
        content: {
          body: '<script>alert("xss")</script>',
          allowHtml: false,
        },
      };

      renderer.render(step);

      const body = document.querySelector('.dap-overlay__body');
      expect(body?.innerHTML).toContain('&lt;script&gt;');
      expect(body?.querySelector('script')).toBeNull();
    });

    it('should include arrow element for tooltips', () => {
      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#test-anchor',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const arrow = document.querySelector('.dap-overlay__arrow');
      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveAttribute('data-popper-arrow');
    });
  });

  describe('Banner rendering', () => {
    it('should render banner', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          title: 'Banner Title',
          body: 'Banner content',
        },
      };

      renderer.render(step);

      const overlay = document.querySelector('[data-step-id="banner-1"]');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('dap-overlay--banner');
    });

    it('should render banner with title', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          title: 'Important',
          body: 'This is important',
        },
      };

      renderer.render(step);

      expect(document.querySelector('.dap-overlay__title')).toHaveTextContent('Important');
    });

    it('should render banner without title', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          body: 'No title',
        },
      };

      renderer.render(step);

      expect(document.querySelector('.dap-overlay__title')).toBeNull();
      expect(document.querySelector('.dap-overlay__body')).toHaveTextContent('No title');
    });

    it('should append banner to document.body', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const overlay = document.querySelector('[data-step-id="banner-1"]');
      expect(overlay?.parentElement).toBe(document.body);
    });
  });

  describe('Modal rendering', () => {
    it('should render modal', () => {
      const step: Step = {
        id: 'modal-1',
        type: 'modal',
        content: {
          title: 'Modal Title',
          body: 'Modal content',
        },
      };

      renderer.render(step);

      const overlay = document.querySelector('.dap-overlay--modal[data-step-id="modal-1"]');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('dap-overlay--modal');
    });

    it('should render modal with backdrop', () => {
      const step: Step = {
        id: 'modal-1',
        type: 'modal',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const backdrop = document.querySelector('.dap-overlay-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('should call onDismiss when backdrop is clicked', () => {
      const step: Step = {
        id: 'modal-1',
        type: 'modal',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const backdrop = document.querySelector('.dap-overlay-backdrop') as HTMLElement;
      backdrop.click();

      expect(mockCallbacks.onDismiss).toHaveBeenCalledWith('modal-1');
    });

    it('should call onDismiss when Escape key is pressed', () => {
      const step: Step = {
        id: 'modal-1',
        type: 'modal',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(mockCallbacks.onDismiss).toHaveBeenCalledWith('modal-1');
    });

    it('should not call onDismiss for non-Escape keys', () => {
      const step: Step = {
        id: 'modal-1',
        type: 'modal',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      expect(mockCallbacks.onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Event listeners', () => {
    it('should call onDismiss when close button is clicked', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          title: 'Test',
          body: 'Test',
        },
      };

      renderer.render(step);

      const closeBtn = document.querySelector('.dap-overlay__close') as HTMLElement;
      closeBtn.click();

      expect(mockCallbacks.onDismiss).toHaveBeenCalledWith('banner-1');
    });

    it('should call onCtaClick when CTA button is clicked', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          body: 'Test',
        },
        actions: {
          cta: {
            label: 'Click',
            callbackId: 'test',
          },
        },
      };

      renderer.render(step);

      const ctaBtn = document.querySelector('.dap-overlay__cta') as HTMLElement;
      ctaBtn.click();

      expect(mockCallbacks.onCtaClick).toHaveBeenCalledWith('banner-1');
    });
  });

  describe('Destroy', () => {
    it('should remove overlay element', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);
      expect(document.querySelector('[data-step-id="banner-1"]')).toBeInTheDocument();

      renderer.destroy('banner-1');
      expect(document.querySelector('[data-step-id="banner-1"]')).not.toBeInTheDocument();
    });

    it('should remove event listeners to prevent memory leaks', () => {
      const step: Step = {
        id: 'modal-1',
        type: 'modal',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);
      renderer.destroy('modal-1');

      // Try to trigger event after destroy
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // Should not be called since listeners were removed
      expect(mockCallbacks.onDismiss).not.toHaveBeenCalled();
    });

    it('should remove modal backdrop', () => {
      const step: Step = {
        id: 'modal-1',
        type: 'modal',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);
      expect(document.querySelector('.dap-overlay-backdrop')).toBeInTheDocument();

      renderer.destroy('modal-1');
      expect(document.querySelector('.dap-overlay-backdrop')).not.toBeInTheDocument();
    });

    it('should handle destroying non-existent step gracefully', () => {
      expect(() => {
        renderer.destroy('nonexistent');
      }).not.toThrow();
    });
  });

  describe('DestroyAll', () => {
    it('should remove all overlays', () => {
      const step1: Step = {
        id: 'banner-1',
        type: 'banner',
        content: { body: 'Test 1' },
      };

      const step2: Step = {
        id: 'banner-2',
        type: 'banner',
        content: { body: 'Test 2' },
      };

      renderer.render(step1);
      renderer.render(step2);

      expect(document.querySelector('[data-step-id="banner-1"]')).toBeInTheDocument();
      expect(document.querySelector('[data-step-id="banner-2"]')).toBeInTheDocument();

      renderer.destroyAll();

      expect(document.querySelector('[data-step-id="banner-1"]')).not.toBeInTheDocument();
      expect(document.querySelector('[data-step-id="banner-2"]')).not.toBeInTheDocument();
    });

    it('should remove all event listeners', () => {
      const step1: Step = {
        id: 'modal-1',
        type: 'modal',
        content: { body: 'Test 1' },
      };

      const step2: Step = {
        id: 'modal-2',
        type: 'modal',
        content: { body: 'Test 2' },
      };

      renderer.render(step1);
      renderer.render(step2);

      renderer.destroyAll();

      // Try to trigger events after destroyAll
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // Should not be called since all listeners were removed
      expect(mockCallbacks.onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Re-rendering', () => {
    it('should replace existing overlay when re-rendering same step', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          body: 'Original content',
        },
      };

      renderer.render(step);
      expect(document.querySelectorAll('[data-step-id="banner-1"]')).toHaveLength(1);

      const updatedStep: Step = {
        ...step,
        content: {
          body: 'Updated content',
        },
      };

      renderer.render(updatedStep);

      // Should still have only one overlay
      expect(document.querySelectorAll('[data-step-id="banner-1"]')).toHaveLength(1);
      expect(document.querySelector('.dap-overlay__body')).toHaveTextContent('Updated content');
    });
  });

  describe('ARIA attributes', () => {
    it('should set correct role for tooltip', () => {
      const step: Step = {
        id: 'tooltip-1',
        type: 'tooltip',
        selector: '#test-anchor',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const overlay = document.querySelector('[data-step-id="tooltip-1"]');
      expect(overlay).toHaveAttribute('role', 'tooltip');
    });

    it('should set correct role for modal', () => {
      const step: Step = {
        id: 'modal-1',
        type: 'modal',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const overlay = document.querySelector('.dap-overlay--modal[data-step-id="modal-1"]');
      expect(overlay).toHaveAttribute('role', 'dialog');
    });

    it('should set aria-live attribute', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          body: 'Test',
        },
      };

      renderer.render(step);

      const overlay = document.querySelector('[data-step-id="banner-1"]');
      expect(overlay).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('HTML escaping', () => {
    it('should escape title to prevent XSS', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          title: '<script>alert("xss")</script>',
          body: 'Test',
        },
      };

      renderer.render(step);

      const title = document.querySelector('.dap-overlay__title');
      expect(title?.querySelector('script')).toBeNull();
      expect(title?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should escape CTA label to prevent XSS', () => {
      const step: Step = {
        id: 'banner-1',
        type: 'banner',
        content: {
          body: 'Test',
        },
        actions: {
          cta: {
            label: '<img src=x onerror=alert("xss")>',
            callbackId: 'test',
          },
        },
      };

      renderer.render(step);

      const cta = document.querySelector('.dap-overlay__cta');
      expect(cta?.querySelector('img')).toBeNull();
      expect(cta?.innerHTML).toContain('&lt;img');
    });
  });
});

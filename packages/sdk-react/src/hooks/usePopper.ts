/**
 * React hook for Popper.js positioning
 *
 * IMPORTANT: To avoid unnecessary Popper recreation, ensure that:
 * - `options.offset` is memoized or a stable reference
 * - `options.placement` and `options.strategy` are stable strings
 *
 * Example:
 * ```tsx
 * const popperOptions = useMemo(() => ({
 *   placement: 'top' as const,
 *   offset: [0, 8] as [number, number],
 *   strategy: 'absolute' as const,
 * }), []);
 *
 * const { setPopperElement } = usePopper(anchorElement, popperOptions);
 * ```
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { createPopper, type Instance as PopperInstance, type Placement } from '@popperjs/core';

export interface UsePopperOptions {
  placement?: Placement;
  offset?: [number, number];
  strategy?: 'absolute' | 'fixed';
}

export function usePopper(
  anchorElement: HTMLElement | null,
  options: UsePopperOptions = {}
) {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);
  const popperInstanceRef = useRef<PopperInstance | null>(null);

  // Serialize options for deep comparison to avoid unnecessary recreation
  const optionsKey = useMemo(
    () => JSON.stringify({
      placement: options.placement || 'auto',
      offset: options.offset || [0, 8],
      strategy: options.strategy || 'absolute',
    }),
    [options.placement, options.offset, options.strategy]
  );

  useEffect(() => {
    if (!anchorElement || !popperElement) {
      return;
    }

    const popperInstance = createPopper(anchorElement, popperElement, {
      placement: options.placement || 'auto',
      strategy: options.strategy || 'absolute',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: options.offset || [0, 8],
          },
        },
        {
          name: 'arrow',
          options: {
            element: arrowElement,
            padding: 8,
          },
        },
      ],
    });

    popperInstanceRef.current = popperInstance;

    return () => {
      popperInstance.destroy();
      popperInstanceRef.current = null;
    };
    // Use optionsKey for deep comparison instead of individual option properties
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorElement, popperElement, arrowElement, optionsKey]);

  return {
    setPopperElement,
    setArrowElement,
    popperInstance: popperInstanceRef.current,
  };
}

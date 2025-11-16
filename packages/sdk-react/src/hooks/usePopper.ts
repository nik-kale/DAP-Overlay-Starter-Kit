/**
 * React hook for Popper.js positioning
 */

import { useEffect, useRef, useState } from 'react';
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
  }, [anchorElement, popperElement, arrowElement, options.placement, options.offset, options.strategy]);

  return {
    setPopperElement,
    setArrowElement,
    popperInstance: popperInstanceRef.current,
  };
}

/**
 * Hook for async HTML sanitization
 */

import { useEffect, useState } from 'react';
import { sanitizeHtml } from '@dap-overlay/sdk-core';

/**
 * Hook to sanitize HTML asynchronously
 * Returns sanitized HTML once loaded, empty string while loading
 */
export function useSanitizedHtml(html: string, shouldSanitize: boolean): string {
  const [sanitized, setSanitized] = useState<string>('');

  useEffect(() => {
    if (!shouldSanitize) {
      setSanitized(html);
      return;
    }

    let cancelled = false;

    sanitizeHtml(html).then((result) => {
      if (!cancelled) {
        setSanitized(result);
      }
    }).catch((error) => {
      if (!cancelled) {
        console.error('Failed to sanitize HTML:', error);
        setSanitized(''); // Fail safe - show nothing on error
      }
    });

    return () => {
      cancelled = true;
    };
  }, [html, shouldSanitize]);

  return sanitized;
}

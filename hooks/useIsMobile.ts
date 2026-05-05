'use client';

import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * SSR-safe hook that returns true when the viewport is ≤768px.
 * Defaults to false on the server so the desktop layout renders first,
 * then hydrates to the correct value on the client.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

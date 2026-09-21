import { useEffect } from 'react';

// Keep track of how many active modals are requesting scroll lock
let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';

/**
 * Custom hook to lock both document.body and document.documentElement scrolling
 * when a modal/drawer is open, with reference counting for nested modals.
 * 
 * @param {boolean} isLocked Whether scrolling should be locked
 */
export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow || '';
        document.documentElement.style.overflow = originalHtmlOverflow || '';
      }
    };
  }, [isLocked]);
}

export default useBodyScrollLock;

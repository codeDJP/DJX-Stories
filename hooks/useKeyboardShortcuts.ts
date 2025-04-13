import { useEffect } from 'react';

interface ShortcutHandlers {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onNumber?: (num: number) => void;
}

export const useKeyboardShortcuts = ({
  onEnter,
  onSpace,
  onEscape,
  onNumber
}: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          onEnter?.();
          break;
        case ' ':
          event.preventDefault();
          onSpace?.();
          break;
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
        default:
          // Handle number keys 1-9 for choice selection
          const num = parseInt(event.key);
          if (!isNaN(num) && num >= 1 && num <= 9) {
            event.preventDefault();
            onNumber?.(num);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onSpace, onEscape, onNumber]);
};
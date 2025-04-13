import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface KeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHelp: React.FC<KeyboardHelpProps> = ({ isOpen, onClose }) => {
  const focusTrapRef = useFocusTrap(isOpen);
  
  const shortcuts = [
    { key: 'Enter', description: 'Start a new story or submit prompt' },
    { key: 'Esc', description: 'Reset and start over' },
    { key: '1-9', description: 'Select story choices (by number)' },
    { key: '?', description: 'Show/hide keyboard shortcuts' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black"
            onClick={onClose}
          />
          <motion.div
            ref={focusTrapRef}
            role="dialog"
            aria-label="Keyboard Shortcuts"
            aria-modal="true"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-djx-gray rounded-xl p-6 md:p-8 max-w-lg w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-djx-yellow mb-6">Keyboard Shortcuts</h2>
            <div className="space-y-4">
              {shortcuts.map(({ key, description }) => (
                <div key={key} className="flex items-center">
                  <kbd className="px-2 py-1 bg-black/50 rounded text-djx-yellow border border-djx-yellow/50 min-w-[2.5rem] text-center">
                    {key}
                  </kbd>
                  <span className="ml-4 text-white">{description}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <Button 
                variant="secondary" 
                onClick={onClose}
                aria-label="Close keyboard shortcuts dialog"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
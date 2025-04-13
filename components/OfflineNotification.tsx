import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineNotificationProps {
  isOffline: boolean;
}

export const OfflineNotification: React.FC<OfflineNotificationProps> = ({ isOffline }) => {
  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50"
        >
          <span className="inline-flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            You are currently offline. Some features may be limited.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
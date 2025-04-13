import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary';
  isFullWidth?: boolean;
  isLoading?: boolean;
  icon?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isFullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  ariaLabel,
  ...props
}) => {
  const baseStyles = "px-6 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-djx-yellow focus:ring-offset-2 focus:ring-offset-djx-dark";
  const variantStyles = {
    primary: "bg-djx-yellow text-black hover:bg-opacity-90",
    secondary: "bg-transparent text-djx-yellow border-2 border-djx-yellow hover:bg-djx-yellow/10"
  };
  const widthStyles = isFullWidth ? "w-full" : "";
  
  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${className} 
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      disabled={disabled || isLoading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      <span className="flex items-center justify-center">
        {isLoading ? (
          <>
            <svg 
              className="animate-spin -ml-1 mr-3 h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="sr-only">Loading</span>
            Loading...
          </>
        ) : (
          <>
            {children}
            {icon && (
              <span className="ml-2" role="img" aria-label={`${icon} icon`}>
                {icon}
              </span>
            )}
          </>
        )}
      </span>
    </motion.button>
  );
};
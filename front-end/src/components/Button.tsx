import React from 'react';
import { motion } from 'framer-motion';
type ButtonProps = {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
};
export function Button({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}: ButtonProps) {
  const baseStyles =
  'px-6 py-3 rounded-full font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-100',
    secondary:
    'bg-transparent text-white border border-white/20 hover:border-white/40'
  };
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={{
        scale: disabled ? 1 : 1.02
      }}
      whileTap={{
        scale: disabled ? 1 : 0.98
      }}>

      {children}
    </motion.button>);

}
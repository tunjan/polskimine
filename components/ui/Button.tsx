import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  
  // Base: Height fixed by padding/line-height, distinct borders
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-md border active:translate-y-[1px]";
  
  const variants = {
    primary: "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:border-gray-800 focus:ring-gray-900",
    secondary: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-400 shadow-sm",
    outline: "bg-transparent border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 focus:ring-gray-900",
    danger: "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 focus:ring-red-200",
    ghost: "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2 text-sm", // Taller, wider click target
    lg: "px-8 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
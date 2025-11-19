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
    primary: "bg-[#1c2c4c] text-white border-[#1c2c4c] hover:bg-[#14213d] hover:border-[#14213d] focus:ring-[#1c2c4c]",
    secondary: "bg-[#fff4f4] text-[#9d0208] border-[#ffdada] hover:bg-[#ffe3e3] hover:border-[#ffc9c9] focus:ring-[#ffdada]",
    outline: "bg-transparent border-slate-300 text-slate-700 hover:border-[#1c2c4c] hover:text-[#1c2c4c] focus:ring-[#1c2c4c]",
    danger: "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 focus:ring-red-200",
    ghost: "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-200"
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
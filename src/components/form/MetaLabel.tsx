import React from 'react';
import clsx from 'clsx';

interface MetaLabelProps {
  className?: string;
  children: React.ReactNode;
}

export const MetaLabel: React.FC<MetaLabelProps> = ({ className, children }) => (
  <label className={clsx('block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3', className)}>
    {children}
  </label>
);
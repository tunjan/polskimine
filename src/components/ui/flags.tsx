import React from 'react';

interface FlagProps {
  className?: string;
}

export const PolishFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF"/>
    <rect y="12" width="32" height="12" fill="#FF6B6B"/>
  </svg>
);

export const NorwegianFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FF6B6B"/>
    <path d="M0,12 h32 M10,0 v24" stroke="#FFFFFF" strokeWidth="6"/>
    <path d="M0,12 h32 M10,0 v24" stroke="#4D96FF" strokeWidth="3"/>
  </svg>
);

export const JapaneseFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF"/>
    <circle cx="16" cy="12" r="7" fill="#FF6B6B"/>
  </svg>
);
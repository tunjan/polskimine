import React from "react";

interface FlagProps {
  className?: string;
}

export const PolishFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF" />
    <rect y="12" width="32" height="12" fill="#DC143C" />
  </svg>
);

export const NorwegianFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#BA0C2F" />
    <path d="M0,12 h32 M10,0 v24" stroke="#FFFFFF" strokeWidth="6" />
    <path d="M0,12 h32 M10,0 v24" stroke="#00205B" strokeWidth="3" />
  </svg>
);

export const JapaneseFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF" />
    <circle cx="16" cy="12" r="7" fill="#BC002D" />
  </svg>
);

export const SpanishFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#AA151B" />
    <rect y="6" width="32" height="12" fill="#F1BF00" />
  </svg>
);

export const GermanFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="8" fill="#000000" />
    <rect y="8" width="32" height="8" fill="#DD0000" />
    <rect y="16" width="32" height="8" fill="#FFCC00" />
  </svg>
);

import React from 'react';

export default function MindMirrorMark({ variant = 'mirror', className = '' }) {
  if (variant === 'candle') {
    return (
      <svg className={`mindmirror-mark ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M30.2 25.8c-7.1-7.6 1.8-13.1 1.5-20.3 7.3 6.1 7.6 12.6 1.4 20.3" fill="currentColor" opacity=".9" />
        <path d="M33.5 26.1c2.2-5.2 8.2-8.2 5.7-14.1 7.5 5.2 5.5 11.1 1.2 15.6" fill="currentColor" opacity=".46" />
        <path d="M32 29v26" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.2 2.8" opacity=".55" />
        <path d="M17 28h15v27H17z" fill="currentColor" opacity=".16" />
        <path d="M32 28h15v27H32z" fill="currentColor" opacity=".27" />
        <path d="M17 28h15v27H17z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
        <path d="M32 28h15v27H32z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
        <path d="M17 38c3-2.7 4.1 3.8 7 1.5 2.3-1.8 4.3-.2 8 1.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 40c4.2-1.7 7.4-4.6 9.3-2.4 1.3 1.5 3.7 1.7 5.7 1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M14 56h37" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M43 8c3.1 1.5 4.3 3.4 4.7 5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".62" />
      </svg>
    );
  }

  return (
    <svg className={`mindmirror-mark ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M13 10.5c0-3 2.5-5.5 5.5-5.5h27C51.3 5 56 9.7 56 15.5v30c0 7.5-6.1 13.5-13.5 13.5h-25C14.5 59 12 56.5 12 53.5z" stroke="currentColor" strokeWidth="2.3" />
      <path d="M32 10v41" stroke="currentColor" strokeWidth="1.15" strokeDasharray="2 3" opacity=".62" />
      <path d="M19 17.5c5-2.4 8-1.2 10 1.4v20.3c-2.1-2.2-5.5-3-10-1.1z" fill="currentColor" opacity=".23" />
      <path d="M19 17.5c4.5-2.1 7.8-1.1 10 1.4v20.3c-2.6-2.1-5.8-2.8-10-1.1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M36 19c4.6-2.7 8.1-1.6 10.2 1.4v20.2c-2.9-2.3-6.1-2.3-10.2.4z" fill="currentColor" opacity=".12" />
      <path d="M36 19c5-2.3 8.1-1.2 10.2 1.4v20.2c-3-2.1-6.4-2-10.2.4z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M20.5 45c2.1-1 4-.9 6 .2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M38 45.5c2.8-1.8 4.9-1.8 7-.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M9 60h46" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M51 13c1.5 2.3 2.1 4.7 1.6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}
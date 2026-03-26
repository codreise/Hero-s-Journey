import React from "react";

export default function PotionIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 3.2h6" stroke="#c6d4ff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10.2 3.5v3.1l-4.1 5.4a6 6 0 004.77 9.64h2.24a6 6 0 004.77-9.64l-4.1-5.4V3.5" fill="url(#potion-glass)" stroke="#d8e2ff" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8.15 12.2c.96 1.5 2.42 2.36 4.29 2.36 1.87 0 3.33-.86 4.29-2.36.48 1 .75 2.08.75 3.14A4.75 4.75 0 0112.73 20H11.3a4.75 4.75 0 01-4.75-4.66c0-1.06.27-2.14.75-3.14z" fill="url(#potion-liquid)" />
      <circle cx="10.1" cy="14.2" r="0.9" fill="rgba(255,255,255,0.6)" />
      <circle cx="14.9" cy="16" r="0.7" fill="rgba(255,255,255,0.35)" />
      <defs>
        <linearGradient id="potion-glass" x1="7" y1="4" x2="18" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.42)" />
          <stop offset="1" stopColor="rgba(180,205,255,0.16)" />
        </linearGradient>
        <linearGradient id="potion-liquid" x1="8" y1="11.8" x2="17" y2="19.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#65f0a4" />
          <stop offset="0.55" stopColor="#2bd48d" />
          <stop offset="1" stopColor="#149e72" />
        </linearGradient>
      </defs>
    </svg>
  );
}
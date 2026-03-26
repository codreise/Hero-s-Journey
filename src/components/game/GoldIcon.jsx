import React from "react";

export default function GoldIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="9" fill="url(#coin-fill)" stroke="#f6d05a" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.2" fill="rgba(255,255,255,0.12)" stroke="rgba(124,77,12,0.45)" strokeWidth="1" />
      <path d="M12 7.8l1.15 2.5 2.73.26-2.04 1.82.58 2.68L12 13.7l-2.42 1.36.58-2.68-2.04-1.82 2.73-.26L12 7.8z" fill="#fff3b0" />
      <ellipse cx="9.1" cy="8.8" rx="2.2" ry="1.2" fill="rgba(255,255,255,0.38)" />
      <defs>
        <linearGradient id="coin-fill" x1="5" y1="4" x2="18" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff1a6" />
          <stop offset="0.45" stopColor="#f7c948" />
          <stop offset="1" stopColor="#d88a16" />
        </linearGradient>
      </defs>
    </svg>
  );
}
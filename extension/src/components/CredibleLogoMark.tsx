import React from 'react';

interface CredibleLogoMarkProps {
  size?: number;
}

export const CredibleLogoMark: React.FC<CredibleLogoMarkProps> = ({ size = 22 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Outer Defensive Hexagonal Shield Contour */}
      <path
        d="M12 2L4 5.5V11C4 16.2 7.4 20.8 12 22C16.6 20.8 20 16.2 20 11V5.5L12 2Z"
        fill="#0F172A"
        stroke="#1E293B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Precision Forensic Diamond Core in Signal Cobalt */}
      <path
        d="M12 6.5L16.2 11L12 15.5L7.8 11L12 6.5Z"
        fill="#0052FF"
      />
      {/* Central High-Contrast Trust Focal Beacon */}
      <circle cx="12" cy="11" r="2.2" fill="#FFFFFF" />
      {/* Geometric Vertical Anchor Line */}
      <line x1="12" y1="15.5" x2="12" y2="18.5" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};


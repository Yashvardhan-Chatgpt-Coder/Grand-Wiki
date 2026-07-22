import { SVGProps } from "react";

export function WalkieTalkieIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Radio Antenna */}
      <path d="M16 8V2" />
      
      {/* Left Dial/knob */}
      <path d="M10 8V5" />
      
      {/* Radio Body */}
      <rect x="7" y="8" width="10" height="14" rx="2" ry="2" />
      
      {/* Screen */}
      <rect x="9" y="10" width="6" height="4" rx="0.5" />
      
      {/* Speaker grille lines */}
      <path d="M10 16h4" />
      <path d="M10 18h4" />
      <path d="M11 20h2" />
    </svg>
  );
}

"use client";

export function CameraMascot({ className }: { className?: string }) {
  const blue = "#62A5D8";
  return (
    <svg
      viewBox="0 0 110 155"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TopicWalk camera mascot"
    >
      {/* Legs drawn first — white camera fill masks their tops */}
      <rect x="31" y="108" width="22" height="40" rx="11" fill={blue} />
      <rect x="57" y="108" width="22" height="40" rx="11" fill={blue} />

      {/* Camera body — nearly square, large rounded corners, white fill covers leg tops */}
      <rect
        x="5"
        y="22"
        width="100"
        height="90"
        rx="18"
        fill="white"
        stroke={blue}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />

      {/* Viewfinder bump */}
      <rect
        x="38"
        y="11"
        width="24"
        height="15"
        rx="7"
        fill="white"
        stroke={blue}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />

      {/* Indicator dot — top left */}
      <circle cx="19" cy="39" r="3.5" stroke={blue} strokeWidth="4" />

      {/* Lens outer ring — large, ~73% of camera height */}
      <circle cx="55" cy="67" r="33" stroke={blue} strokeWidth="5.5" />

      {/* Lens inner ring */}
      <circle cx="55" cy="67" r="21" stroke={blue} strokeWidth="4" />

      {/* Eyes */}
      <circle cx="47" cy="63" r="2.5" fill={blue} />
      <circle cx="63" cy="63" r="2.5" fill={blue} />

      {/* Smile */}
      <path
        d="M47 70 Q55 79 63 70"
        stroke={blue}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

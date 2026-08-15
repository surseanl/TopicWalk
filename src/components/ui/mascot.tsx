"use client";

import { type MotionValue, motion, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  className?: string;
  pupilX?: MotionValue<number>;
  pupilY?: MotionValue<number>;
}

export function CameraMascot({
  className,
  pupilX: pxProp,
  pupilY: pyProp,
}: Props) {
  const blue = "#62A5D8";
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const px = pxProp ?? fallbackX;
  const py = pyProp ?? fallbackY;

  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      id = setTimeout(
        () => {
          setIsBlinking(true);
          setTimeout(() => {
            setIsBlinking(false);
            scheduleNext();
          }, 150);
        },
        2000 + Math.random() * 3000,
      );
    };
    scheduleNext();
    return () => clearTimeout(id);
  }, []);

  return (
    <svg
      viewBox="0 0 110 155"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TopicWalk camera mascot"
    >
      {/* Legs */}
      <rect x="31" y="108" width="22" height="40" rx="11" fill={blue} />
      <rect x="57" y="108" width="22" height="40" rx="11" fill={blue} />

      {/* Camera body */}
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

      {/* Indicator dot */}
      <circle cx="19" cy="39" r="3.5" stroke={blue} strokeWidth="4" />

      {/* Lens outer ring */}
      <circle cx="55" cy="67" r="33" stroke={blue} strokeWidth="5.5" />

      {/* Lens inner ring */}
      <circle cx="55" cy="67" r="21" stroke={blue} strokeWidth="4" />

      {/* Eyes — cursor tracking + blink */}
      <motion.g style={{ x: px, y: py }}>
        <motion.circle
          cx={47}
          cy={63}
          r={2.5}
          fill={blue}
          animate={{ scaleY: isBlinking ? 0.05 : 1 }}
          transition={{ duration: 0.06 }}
        />
        <motion.circle
          cx={63}
          cy={63}
          r={2.5}
          fill={blue}
          animate={{ scaleY: isBlinking ? 0.05 : 1 }}
          transition={{ duration: 0.06 }}
        />
      </motion.g>

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

import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

// Square viewBox: 0 0 100 100
// Anatomy fractions (match SnappyCharacter overlay positions):
//   Head:   y  0 – 18
//   Torso:  y 22 – 55
//   Legs:   y 55 – 90
//   Feet:   y 90 – 100

export function SnappyBase({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="snBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1c1c28" />
          <Stop offset="1" stopColor="#0c0c14" />
        </LinearGradient>
        <LinearGradient id="snVisor" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3b82f6" />
          <Stop offset="1" stopColor="#1d4ed8" />
        </LinearGradient>
        <LinearGradient id="snArm" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1e1e2c" />
          <Stop offset="1" stopColor="#0e0e18" />
        </LinearGradient>
        <LinearGradient id="snFoot" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#18182a" />
          <Stop offset="1" stopColor="#111120" />
        </LinearGradient>
      </Defs>

      {/* ── HEAD (y 0–18) ─────────────────────────────────────────────────── */}
      {/* Outer casing */}
      <Rect x="27" y="0" width="46" height="18" rx="5" fill="url(#snBody)" />
      {/* Visor screen — eyes at y≈8–10, matching glasses overlay at 12% */}
      <Rect x="30" y="2" width="40" height="13" rx="3.5" fill="url(#snVisor)" />
      {/* Screen glass sheen */}
      <Rect
        x="30"
        y="2"
        width="40"
        height="4"
        rx="3.5"
        fill="rgba(255,255,255,0.08)"
      />
      {/* Left eye */}
      <Circle cx="40" cy="9" r="4.2" fill="#ffffff" />
      {/* Right eye */}
      <Circle cx="60" cy="9" r="4.2" fill="#ffffff" />
      {/* Left iris */}
      <Circle cx="40" cy="9" r="2.4" fill="#1d4ed8" />
      {/* Right iris */}
      <Circle cx="60" cy="9" r="2.4" fill="#1d4ed8" />
      {/* Left pupil */}
      <Circle cx="40" cy="9" r="1.1" fill="#000" />
      {/* Right pupil */}
      <Circle cx="60" cy="9" r="1.1" fill="#000" />
      {/* Eye shine */}
      <Circle cx="38.5" cy="7.5" r="1" fill="rgba(255,255,255,0.8)" />
      <Circle cx="58.5" cy="7.5" r="1" fill="rgba(255,255,255,0.8)" />
      {/* Visor bottom rim */}
      <Rect
        x="30"
        y="13.5"
        width="40"
        height="1.5"
        rx="0.75"
        fill="#1e40af"
        opacity="0.6"
      />
      {/* Head bottom (chin strip) */}
      <Rect x="30" y="15" width="40" height="3" rx="1.5" fill="#14141e" />

      {/* ── NECK (y 18–23) ───────────────────────────────────────────────── */}
      <Rect x="36" y="18" width="28" height="6" rx="3" fill="url(#snBody)" />

      {/* ── TORSO (y 23–55) ──────────────────────────────────────────────── */}
      <Rect x="18" y="23" width="64" height="32" rx="6" fill="url(#snBody)" />
      {/* Chest panel (inset) */}
      <Rect x="26" y="28" width="48" height="18" rx="4" fill="#08080f" />
      {/* Chest indicator light */}
      <Circle cx="50" cy="37" r="2.8" fill="#2563eb" opacity="0.7" />
      <Circle cx="50" cy="37" r="1.4" fill="#60a5fa" />
      {/* Side bolts */}
      <Circle cx="21" cy="27" r="2" fill="#131320" />
      <Circle cx="79" cy="27" r="2" fill="#131320" />
      {/* Waist seam */}
      <Rect x="18" y="51" width="64" height="3" rx="1.5" fill="#09090f" />

      {/* ── LEFT ARM (y 25–52) ───────────────────────────────────────────── */}
      <Rect x="5" y="25" width="13" height="26" rx="5" fill="url(#snArm)" />
      {/* Left fist */}
      <Rect x="4" y="49" width="15" height="8" rx="4" fill="#0c0c16" />

      {/* ── RIGHT ARM (y 25–52) ──────────────────────────────────────────── */}
      <Rect x="82" y="25" width="13" height="26" rx="5" fill="url(#snArm)" />
      {/* Right fist */}
      <Rect x="81" y="49" width="15" height="8" rx="4" fill="#0c0c16" />

      {/* ── LEGS (y 55–90) ───────────────────────────────────────────────── */}
      {/* Left leg */}
      <Rect x="26" y="55" width="18" height="34" rx="5" fill="url(#snBody)" />
      {/* Right leg */}
      <Rect x="56" y="55" width="18" height="34" rx="5" fill="url(#snBody)" />
      {/* Knee plates */}
      <Rect x="27" y="67" width="16" height="5" rx="2.5" fill="#111118" />
      <Rect x="57" y="67" width="16" height="5" rx="2.5" fill="#111118" />

      {/* ── FEET (y 90–100) ──────────────────────────────────────────────── */}
      {/* Left foot */}
      <Rect x="21" y="89" width="27" height="11" rx="5" fill="url(#snFoot)" />
      {/* Right foot */}
      <Rect x="52" y="89" width="27" height="11" rx="5" fill="url(#snFoot)" />
      {/* Sole lines */}
      <Rect
        x="21"
        y="96"
        width="27"
        height="3"
        rx="1.5"
        fill="#1d1d2e"
        opacity="0.8"
      />
      <Rect
        x="52"
        y="96"
        width="27"
        height="3"
        rx="1.5"
        fill="#1d1d2e"
        opacity="0.8"
      />
    </Svg>
  );
}

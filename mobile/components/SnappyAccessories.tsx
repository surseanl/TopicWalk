import type React from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type AccessorySlots = {
  hat: string;
  glasses: string;
  outfit: string;
  bottom: string;
  shoes: string;
  bag: string;
};

export function parseAccessory(val: string): AccessorySlots {
  const empty = {
    hat: "",
    glasses: "",
    outfit: "",
    bottom: "",
    shoes: "",
    bag: "",
  };
  if (!val) return empty;
  const p = val.split("|");
  if (p.length >= 6)
    return {
      hat: p[0] ?? "",
      glasses: p[1] ?? "",
      outfit: p[2] ?? "",
      bottom: p[3] ?? "",
      shoes: p[4] ?? "",
      bag: p[5] ?? "",
    };
  if (p.length >= 3)
    return {
      ...empty,
      hat: p[0] ?? "",
      glasses: p[1] ?? "",
      outfit: p[2] ?? "",
    };
  // 2-part legacy: hat|outfit
  return { ...empty, hat: p[0] ?? "", outfit: p[1] ?? "" };
}

export function encodeAccessory({
  hat,
  glasses,
  outfit,
  bottom,
  shoes,
  bag,
}: AccessorySlots): string {
  if (!hat && !glasses && !outfit && !bottom && !shoes && !bag) return "";
  return `${hat}|${glasses}|${outfit}|${bottom}|${shoes}|${bag}`;
}

// ─── HATS ────────────────────────────────────────────────────────────────────

export function BaseballCap({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.68);
  const g1 = `bc1${_uid}`;
  const g2 = `bc2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 68">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2a2a2e" />
          <Stop offset="1" stopColor="#111113" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a1a1d" />
          <Stop offset="1" stopColor="#080809" />
        </LinearGradient>
      </Defs>
      {/* Crown */}
      <Path
        d="M18 56 C16 36 24 14 50 8 C76 14 84 36 82 56 Z"
        fill={`url(#${g1})`}
      />
      {/* Panel seams */}
      <Path d="M50 8 L50 56" stroke="#333336" strokeWidth="1" opacity="0.6" />
      <Path
        d="M34 10 Q34 34 26 56"
        stroke="#333336"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <Path
        d="M66 10 Q66 34 74 56"
        stroke="#333336"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Brim */}
      <Ellipse cx="50" cy="57" rx="46" ry="10" fill={`url(#${g2})`} />
      {/* Brim underside */}
      <Path d="M18 57 Q50 65 82 57 Q50 63 18 57 Z" fill="#1e1e22" />
      {/* Brim edge highlight */}
      <Path
        d="M18 54 Q50 60 82 54"
        stroke="#3a3a3e"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      {/* Button top */}
      <Circle cx="50" cy="9" r="4" fill="#3a3a3e" />
      <Circle cx="50" cy="9" r="2.5" fill="#555558" />
      {/* NY logo */}
      <Path
        d="M38 28 L38 44 L45 28 L45 44"
        stroke="white"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M53 28 L53 44 M53 28 L61 44 L61 28"
        stroke="white"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Highlight on crown */}
      <Path
        d="M24 22 Q38 18 50 18"
        stroke="#3e3e42"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CowboyHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.72);
  const g1 = `cg1${_uid}`;
  const g2 = `cg2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 120 72">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c47a1a" />
          <Stop offset="0.5" stopColor="#a16207" />
          <Stop offset="1" stopColor="#78350f" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#92400e" />
          <Stop offset="1" stopColor="#5a2506" />
        </LinearGradient>
      </Defs>
      {/* Wide brim */}
      <Ellipse cx="60" cy="57" rx="58" ry="13" fill={`url(#${g2})`} />
      <Ellipse cx="60" cy="54" rx="54" ry="9" fill="#92400e" />
      {/* Brim highlight */}
      <Path
        d="M14 54 Q60 48 106 54"
        stroke="#b45309"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      {/* Crown */}
      <Path
        d="M30 53 C28 32 38 12 60 8 C82 12 92 32 90 53 Z"
        fill={`url(#${g1})`}
      />
      {/* Crown texture */}
      <Path
        d="M32 42 Q60 38 88 42"
        stroke="#92400e"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M34 32 Q60 28 86 32"
        stroke="#92400e"
        strokeWidth="1.2"
        fill="none"
        opacity="0.4"
      />
      <Path
        d="M36 22 Q60 18 84 22"
        stroke="#92400e"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
      {/* Hatband */}
      <Path
        d="M30 53 Q60 49 90 53"
        stroke="#3b1a06"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M30 53 Q60 49 90 53"
        stroke="#6b3008"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Crown highlight */}
      <Path
        d="M38 20 Q52 14 62 16"
        stroke="#d4a042"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      {/* Gold star badge */}
      <Polygon
        points="60,42 61.5,46.6 66.5,46.6 62.6,49.4 64.1,54 60,51.1 55.9,54 57.4,49.4 53.5,46.6 58.5,46.6"
        fill="#fbbf24"
      />
      <Polygon
        points="60,43.5 61,47 64.5,47 61.8,49 62.8,52.5 60,50.5 57.2,52.5 58.2,49 55.5,47 59,47"
        fill="#fde68a"
        opacity="0.7"
      />
    </Svg>
  );
}

export function Beanie({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.78);
  const g = `bn${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 90 78">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1e2d40" />
          <Stop offset="1" stopColor="#0f1a26" />
        </LinearGradient>
      </Defs>
      {/* Main dome */}
      <Path
        d="M10 62 C8 34 20 10 45 6 C70 10 82 34 80 62 Z"
        fill={`url(#${g})`}
      />
      {/* Knit texture horizontal lines */}
      <Path
        d="M11 54 Q45 49 79 54"
        stroke="#2a3d52"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      <Path
        d="M11 46 Q45 40 79 46"
        stroke="#2a3d52"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M12 38 Q45 32 78 38"
        stroke="#2a3d52"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M13 30 Q45 23 77 30"
        stroke="#2a3d52"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <Path
        d="M15 22 Q45 15 75 22"
        stroke="#2a3d52"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />
      {/* Ribbed cuff */}
      <Rect x="10" y="54" width="70" height="14" rx="5" fill="#141e2a" />
      {/* Cuff ribs */}
      <Path d="M17 54 L17 68" stroke="#2a3d52" strokeWidth="2" opacity="0.5" />
      <Path d="M25 54 L25 68" stroke="#2a3d52" strokeWidth="2" opacity="0.5" />
      <Path d="M33 54 L33 68" stroke="#2a3d52" strokeWidth="2" opacity="0.5" />
      <Path d="M41 54 L41 68" stroke="#2a3d52" strokeWidth="2" opacity="0.5" />
      <Path d="M49 54 L49 68" stroke="#2a3d52" strokeWidth="2" opacity="0.5" />
      <Path d="M57 54 L57 68" stroke="#2a3d52" strokeWidth="2" opacity="0.5" />
      <Path d="M65 54 L65 68" stroke="#2a3d52" strokeWidth="2" opacity="0.5" />
      <Path d="M73 54 L73 68" stroke="#2a3d52" strokeWidth="2" opacity="0.5" />
      {/* Pompom */}
      <Circle cx="45" cy="9" r="13" fill="#1d4ed8" />
      <Circle cx="45" cy="9" r="10" fill="#3b82f6" />
      <Circle cx="45" cy="9" r="7" fill="#60a5fa" />
      {/* Pompom highlights */}
      <Circle cx="41" cy="6" r="2.5" fill="#93c5fd" opacity="0.65" />
      <Circle cx="50" cy="7" r="2" fill="#93c5fd" opacity="0.55" />
      <Circle cx="44" cy="14" r="2" fill="#93c5fd" opacity="0.45" />
      {/* Dome highlight */}
      <Path
        d="M18 26 Q35 18 48 18"
        stroke="#2e4a65"
        strokeWidth="3"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BucketHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.7);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 70">
      <Ellipse cx="50" cy="56" rx="47" ry="12" fill="#f472b6" />
      <Path d="M22 56 C20 32 30 14 50 10 C70 14 80 32 78 56 Z" fill="#f9a8d4" />
      <Ellipse cx="50" cy="57" rx="29" ry="6" fill="#f472b6" />
      <Ellipse
        cx="50"
        cy="56"
        rx="44"
        ry="9"
        stroke="#fb7185"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4,3"
      />
      <Circle cx="70" cy="40" r="5" fill="#fbbf24" />
      <Circle cx="70" cy="32" r="4" fill="#fda4af" />
      <Circle cx="76" cy="36" r="4" fill="#fda4af" />
      <Circle cx="76" cy="44" r="4" fill="#fda4af" />
      <Circle cx="64" cy="44" r="4" fill="#fda4af" />
      <Circle cx="64" cy="36" r="4" fill="#fda4af" />
    </Svg>
  );
}

export function FrogHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.85);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 85">
      <Path d="M14 68 C12 38 22 15 50 10 C78 15 88 38 86 68 Z" fill="#16a34a" />
      <Circle cx="28" cy="18" r="14" fill="#22c55e" />
      <Circle
        cx="28"
        cy="18"
        r="14"
        stroke="#15803d"
        strokeWidth="2"
        fill="none"
      />
      <Circle cx="72" cy="18" r="14" fill="#22c55e" />
      <Circle
        cx="72"
        cy="18"
        r="14"
        stroke="#15803d"
        strokeWidth="2"
        fill="none"
      />
      <Circle cx="28" cy="19" r="7" fill="#1a1a1a" />
      <Circle cx="72" cy="19" r="7" fill="#1a1a1a" />
      <Circle cx="30" cy="16" r="2.5" fill="white" opacity="0.8" />
      <Circle cx="74" cy="16" r="2.5" fill="white" opacity="0.8" />
      <Path
        d="M38 56 Q50 64 62 56"
        stroke="#15803d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="45" cy="50" r="2.5" fill="#15803d" />
      <Circle cx="55" cy="50" r="2.5" fill="#15803d" />
    </Svg>
  );
}

export function Crown({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.7);
  const g1 = `cr1${_uid}`;
  const g2 = `cr2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 70">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fde68a" />
          <Stop offset="1" stopColor="#d97706" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fbbf24" />
          <Stop offset="1" stopColor="#b45309" />
        </LinearGradient>
      </Defs>
      <Path
        d="M5 65 L5 42 L22 10 L33 42 L50 5 L67 42 L78 10 L95 42 L95 65 Z"
        fill={`url(#${g1})`}
      />
      <Path
        d="M5 65 L5 42 L22 10 L33 42 L50 5 L67 42 L78 10 L95 42 L95 65"
        stroke="#b45309"
        strokeWidth="1.5"
        fill="none"
      />
      <Rect x="5" y="52" width="90" height="13" rx="3" fill={`url(#${g2})`} />
      <Rect
        x="5"
        y="52"
        width="90"
        height="13"
        rx="3"
        stroke="#b45309"
        strokeWidth="1"
        fill="none"
      />
      <Circle cx="50" cy="14" r="7" fill="#ef4444" />
      <Circle cx="50" cy="14" r="4.5" fill="#fca5a5" />
      <Circle cx="22" cy="20" r="5" fill="#3b82f6" />
      <Circle cx="22" cy="20" r="3" fill="#93c5fd" />
      <Circle cx="78" cy="20" r="5" fill="#8b5cf6" />
      <Circle cx="78" cy="20" r="3" fill="#c4b5fd" />
      <Circle cx="25" cy="58" r="3" fill="#fde68a" />
      <Circle cx="50" cy="58" r="3" fill="#fde68a" />
      <Circle cx="75" cy="58" r="3" fill="#fde68a" />
    </Svg>
  );
}

export function SantaHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.85);
  const g = `sh${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 85">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ef4444" />
          <Stop offset="1" stopColor="#b91c1c" />
        </LinearGradient>
      </Defs>
      {/* Hat body - conical */}
      <Path d="M14 66 Q22 28 56 4 Q68 38 86 66 Z" fill={`url(#${g})`} />
      {/* Shading fold */}
      <Path
        d="M42 52 Q52 28 56 4 Q60 28 58 52 Z"
        fill="#991b1b"
        opacity="0.4"
      />
      {/* Highlight */}
      <Path
        d="M30 48 Q44 24 54 8"
        stroke="#f87171"
        strokeWidth="3"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      {/* White fluffy brim */}
      <Ellipse cx="50" cy="67" rx="38" ry="11" fill="white" />
      <Ellipse cx="50" cy="65" rx="36" ry="8" fill="#f8fafc" />
      {/* Brim texture bumps */}
      <Path
        d="M16 66 Q30 58 50 62 Q70 58 84 66"
        stroke="#e2e8f0"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M18 70 Q35 64 50 67 Q65 64 82 70"
        stroke="#e2e8f0"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      {/* White pompom at tip */}
      <Circle cx="56" cy="7" r="12" fill="white" />
      <Circle cx="56" cy="7" r="9" fill="#f1f5f9" />
      <Circle cx="52" cy="4" r="3" fill="white" opacity="0.8" />
    </Svg>
  );
}

export function WizardHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.92);
  const g = `wz${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 92">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7c3aed" />
          <Stop offset="1" stopColor="#312e81" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="50" cy="74" rx="47" ry="13" fill="#4c1d95" />
      <Path d="M22 74 Q36 30 50 5 Q64 30 78 74 Z" fill={`url(#${g})`} />
      <Polygon
        points="50,30 51.5,34.6 56.4,34.6 52.4,37.4 53.9,42 50,39.2 46.1,42 47.6,37.4 43.6,34.6 48.5,34.6"
        fill="#fbbf24"
      />
      <Circle cx="62" cy="52" r="4" fill="#fbbf24" />
      <Circle cx="38" cy="58" r="3" fill="#a78bfa" />
      <Path
        d="M24 74 Q50 68 76 74"
        stroke="#7c3aed"
        strokeWidth="5"
        fill="none"
      />
      <Path
        d="M24 74 Q50 68 76 74"
        stroke="#fbbf24"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,4"
      />
    </Svg>
  );
}

// ─── GLASSES ─────────────────────────────────────────────────────────────────

export function Sunglasses({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.35);
  const g1 = `sg1${_uid}`;
  const g2 = `sg2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 110 38">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2a2d35" />
          <Stop offset="1" stopColor="#111318" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3a3d45" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#111318" stopOpacity="0.8" />
        </LinearGradient>
      </Defs>
      {/* Left lens - wayfarer trapezoidal shape */}
      <Path
        d="M6 6 Q6 4 10 4 L44 4 Q48 4 48 6 L48 28 Q48 32 44 32 L10 32 Q6 32 6 28 Z"
        fill={`url(#${g1})`}
      />
      <Path
        d="M6 6 Q6 4 10 4 L44 4 Q48 4 48 6 L48 28 Q48 32 44 32 L10 32 Q6 32 6 28 Z"
        stroke="#555"
        strokeWidth="2"
        fill="none"
      />
      {/* Left lens glare */}
      <Path
        d="M12 9 Q22 7 30 10"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.18"
        strokeLinecap="round"
      />
      <Path
        d="M12 14 Q18 12 22 14"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
        opacity="0.1"
        strokeLinecap="round"
      />
      {/* Right lens */}
      <Path
        d="M62 6 Q62 4 66 4 L100 4 Q104 4 104 6 L104 28 Q104 32 100 32 L66 32 Q62 32 62 28 Z"
        fill={`url(#${g1})`}
      />
      <Path
        d="M62 6 Q62 4 66 4 L100 4 Q104 4 104 6 L104 28 Q104 32 100 32 L66 32 Q62 32 62 28 Z"
        stroke="#555"
        strokeWidth="2"
        fill="none"
      />
      {/* Right lens glare */}
      <Path
        d="M68 9 Q78 7 86 10"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.18"
        strokeLinecap="round"
      />
      <Path
        d="M68 14 Q74 12 78 14"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
        opacity="0.1"
        strokeLinecap="round"
      />
      {/* Bridge */}
      <Path
        d="M48 17 L62 17"
        stroke="#444"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Arms */}
      <Path
        d="M6 17 L0 18"
        stroke="#333"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <Path
        d="M104 17 L110 18"
        stroke="#333"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function RoundGlasses({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.4);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 44">
      {/* Left lens gold rim */}
      <Circle
        cx="28"
        cy="22"
        r="19"
        fill="rgba(217,119,6,0.08)"
        stroke="#d97706"
        strokeWidth="2.5"
      />
      {/* Left inner rim detail */}
      <Circle
        cx="28"
        cy="22"
        r="16"
        fill="none"
        stroke="#b45309"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Left glare */}
      <Path
        d="M16 13 Q22 10 27 13"
        stroke="#fbbf24"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* Right lens gold rim */}
      <Circle
        cx="82"
        cy="22"
        r="19"
        fill="rgba(217,119,6,0.08)"
        stroke="#d97706"
        strokeWidth="2.5"
      />
      {/* Right inner rim detail */}
      <Circle
        cx="82"
        cy="22"
        r="16"
        fill="none"
        stroke="#b45309"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Right glare */}
      <Path
        d="M70 13 Q76 10 81 13"
        stroke="#fbbf24"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* Wire bridge */}
      <Path
        d="M47 22 L63 22"
        stroke="#d97706"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Arms */}
      <Path
        d="M9 22 L0 22"
        stroke="#b45309"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M101 22 L110 22"
        stroke="#b45309"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Nose pad hints */}
      <Path
        d="M44 24 Q45 26 47 24"
        stroke="#d97706"
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M63 24 Q65 26 66 24"
        stroke="#d97706"
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
    </Svg>
  );
}

export function HeartGlasses({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.42);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 46">
      {/* Left heart lens */}
      <Path
        d="M28 41 C4 27 4 10 20 10 C25 10 28 16 28 16 C28 16 31 10 36 10 C52 10 52 27 28 41 Z"
        fill="#f43f5e"
      />
      {/* Left outline */}
      <Path
        d="M28 41 C4 27 4 10 20 10 C25 10 28 16 28 16 C28 16 31 10 36 10 C52 10 52 27 28 41 Z"
        stroke="#be123c"
        strokeWidth="1.8"
        fill="none"
      />
      {/* Left glare */}
      <Path
        d="M14 15 Q20 11 25 14"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <Path
        d="M12 21 Q16 18 20 20"
        stroke="white"
        strokeWidth="1"
        fill="none"
        opacity="0.25"
        strokeLinecap="round"
      />
      {/* Right heart lens */}
      <Path
        d="M82 41 C58 27 58 10 74 10 C79 10 82 16 82 16 C82 16 85 10 90 10 C106 10 106 27 82 41 Z"
        fill="#f43f5e"
      />
      {/* Right outline */}
      <Path
        d="M82 41 C58 27 58 10 74 10 C79 10 82 16 82 16 C82 16 85 10 90 10 C106 10 106 27 82 41 Z"
        stroke="#be123c"
        strokeWidth="1.8"
        fill="none"
      />
      {/* Right glare */}
      <Path
        d="M68 15 Q74 11 79 14"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <Path
        d="M66 21 Q70 18 74 20"
        stroke="white"
        strokeWidth="1"
        fill="none"
        opacity="0.25"
        strokeLinecap="round"
      />
      {/* Bridge */}
      <Path
        d="M52 26 L58 26"
        stroke="#f43f5e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Arms */}
      <Path
        d="M4 26 L0 26"
        stroke="#be123c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M106 26 L110 26"
        stroke="#be123c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SportShades({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.4);
  const g1 = `sp1${_uid}`;
  const g2 = `sp2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 120 44">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#2563eb" />
          <Stop offset="0.4" stopColor="#7c3aed" />
          <Stop offset="0.7" stopColor="#db2777" />
          <Stop offset="1" stopColor="#0891b2" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#18181b" />
          <Stop offset="1" stopColor="#09090b" />
        </LinearGradient>
      </Defs>
      {/* Frame outer */}
      <Path d="M6 38 Q60 4 114 38 Q60 28 6 38 Z" fill={`url(#${g2})`} />
      {/* Lens mirrored fill */}
      <Path
        d="M8 36 Q60 8 112 36 Q60 24 8 36 Z"
        fill={`url(#${g1})`}
        opacity="0.85"
      />
      {/* Frame border top */}
      <Path
        d="M6 38 Q60 4 114 38"
        stroke="#111"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Lens glare */}
      <Path
        d="M20 30 Q40 16 60 20"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      {/* Center bridge ridge */}
      <Path d="M56 22 Q60 20 64 22" stroke="#111" strokeWidth="2" fill="none" />
      {/* Mountain icon on lens */}
      <Path
        d="M52 31 L60 22 L68 31"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.35"
        strokeLinejoin="round"
      />
      {/* Arms */}
      <Path
        d="M6 38 L0 40"
        stroke="#333"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <Path
        d="M114 38 L120 40"
        stroke="#333"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── OUTFITS ──────────────────────────────────────────────────────────────────

export function TShirt({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.72);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 72">
      {/* Left sleeve */}
      <Path
        d="M24 14 L2 6 L0 30 L24 28 Z"
        fill="white"
        stroke="#d1d5db"
        strokeWidth="1.5"
      />
      {/* Right sleeve */}
      <Path
        d="M76 14 L98 6 L100 30 L76 28 Z"
        fill="white"
        stroke="#d1d5db"
        strokeWidth="1.5"
      />
      {/* Body */}
      <Rect
        x="20"
        y="12"
        width="60"
        height="60"
        rx="3"
        fill="white"
        stroke="#d1d5db"
        strokeWidth="1.5"
      />
      {/* Collar round neck */}
      <Path
        d="M36 12 Q50 28 64 12"
        stroke="#d1d5db"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Collar inner */}
      <Path
        d="M38 12 Q50 24 62 12"
        stroke="#e5e7eb"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Sleeve seam left */}
      <Path d="M24 14 L24 28" stroke="#e5e7eb" strokeWidth="1" />
      {/* Sleeve seam right */}
      <Path d="M76 14 L76 28" stroke="#e5e7eb" strokeWidth="1" />
      {/* Side seams */}
      <Path d="M20 28 L20 72" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
      <Path d="M80 28 L80 72" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
      {/* Star graphic */}
      <Polygon
        points="50,34 51.8,40 58,40 53,43.8 54.8,50 50,46.2 45.2,50 47,43.8 42,40 48.2,40"
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      {/* Body highlight */}
      <Path
        d="M28 30 Q35 28 42 30"
        stroke="#f9fafb"
        strokeWidth="4"
        fill="none"
        opacity="0.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Hoodie({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.82);
  const g = `hd${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 82">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2a2a2d" />
          <Stop offset="1" stopColor="#141416" />
        </LinearGradient>
      </Defs>
      {/* Left sleeve */}
      <Path
        d="M22 22 L2 16 L0 42 L22 40 Z"
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth="1"
      />
      {/* Right sleeve */}
      <Path
        d="M78 22 L98 16 L100 42 L78 40 Z"
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth="1"
      />
      {/* Body */}
      <Rect x="18" y="20" width="64" height="62" rx="5" fill={`url(#${g})`} />
      {/* Hood bump at back */}
      <Path
        d="M28 20 Q50 2 72 20 Q60 10 50 9 Q40 10 28 20 Z"
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth="1"
      />
      {/* Hood tunnel opening */}
      <Path d="M38 20 Q50 14 62 20 Q50 18 38 20 Z" fill="#1a1a1c" />
      {/* Center zip seam */}
      <Path
        d="M50 20 L50 82"
        stroke="#3f3f46"
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Drawstrings */}
      <Path
        d="M44 20 Q42 30 40 40"
        stroke="#555558"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M56 20 Q58 30 60 40"
        stroke="#555558"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="40" cy="41" r="2.5" fill="#3f3f42" />
      <Circle cx="60" cy="41" r="2.5" fill="#3f3f42" />
      {/* Kangaroo pocket */}
      <Rect
        x="30"
        y="54"
        width="40"
        height="20"
        rx="5"
        fill="#1c1c1e"
        stroke="#3f3f46"
        strokeWidth="1.5"
      />
      <Path d="M50 54 L50 74" stroke="#3f3f46" strokeWidth="1" opacity="0.5" />
      {/* Nike-style swoosh */}
      <Path
        d="M34 38 Q44 33 56 36 Q50 40 40 40 Z"
        fill="#3f3f46"
        opacity="0.7"
      />
      {/* Body highlight */}
      <Path
        d="M22 30 Q32 26 38 28"
        stroke="#404044"
        strokeWidth="3"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* Ribbed cuffs on sleeves */}
      <Path d="M0 36 L22 38" stroke="#2a2a2d" strokeWidth="4" />
      <Path d="M100 36 L78 38" stroke="#2a2a2d" strokeWidth="4" />
    </Svg>
  );
}

export function VarsityJacket({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.82);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 82">
      <Path
        d="M22 18 L2 15 L0 42 L22 40 Z"
        fill="#1d4ed8"
        stroke="#1e40af"
        strokeWidth="1"
      />
      <Rect x="0" y="23" width="22" height="6" fill="#f5f5f5" opacity="0.8" />
      <Path
        d="M78 18 L98 15 L100 42 L78 40 Z"
        fill="#1d4ed8"
        stroke="#1e40af"
        strokeWidth="1"
      />
      <Rect x="78" y="23" width="22" height="6" fill="#f5f5f5" opacity="0.8" />
      <Rect x="18" y="16" width="64" height="66" rx="5" fill="#1d4ed8" />
      <Path d="M36 16 L36 10 Q50 6 64 10 L64 16" fill="#1e293b" />
      <Path d="M50 16 L50 82" stroke="#1e40af" strokeWidth="1.5" />
      <Path
        d="M58 34 Q52 32 50 36 Q52 40 58 38 Q64 40 62 44 Q58 47 52 46"
        stroke="#fbbf24"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="18" y="70" width="64" height="12" rx="3" fill="#1e3a8a" />
    </Svg>
  );
}

export function Necklace({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.48);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 48">
      {/* Chain - outer gold */}
      <Path
        d="M10 8 Q50 40 90 8"
        stroke="#d97706"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Chain links */}
      <Path
        d="M10 8 Q50 40 90 8"
        stroke="#fbbf24"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6,4"
      />
      {/* Chain highlight */}
      <Path
        d="M10 8 Q50 40 90 8"
        stroke="#fde68a"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6,4"
        strokeDashoffset="3"
        opacity="0.7"
      />
      {/* Pendant drop line */}
      <Path
        d="M50 38 L50 44"
        stroke="#d97706"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Star pendant */}
      <Polygon
        points="50,32 51.6,37 57,37 52.7,40.1 54.4,45.2 50,42 45.6,45.2 47.3,40.1 43,37 48.4,37"
        fill="#f59e0b"
      />
      <Polygon
        points="50,33.5 51.2,37.5 56,37.5 52.3,40 53.5,44.5 50,42 46.5,44.5 47.7,40 44,37.5 48.8,37.5"
        fill="#fde68a"
      />
      {/* Clasp at ends */}
      <Circle cx="10" cy="8" r="3" fill="#d97706" />
      <Circle cx="90" cy="8" r="3" fill="#d97706" />
    </Svg>
  );
}

export function Wings({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const w = Math.round(size * 1.15);
  const h = Math.round(size * 0.65);
  const g = `wg${_uid}`;
  return (
    <Svg width={w} height={h} viewBox="0 0 130 70">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="white" />
          <Stop offset="1" stopColor="#bfdbfe" />
        </LinearGradient>
      </Defs>
      <Path
        d="M65 35 Q50 12 8 8 Q4 22 18 36 Q34 44 65 40 Z"
        fill={`url(#${g})`}
        stroke="#bfdbfe"
        strokeWidth="1.5"
      />
      <Path
        d="M65 37 Q38 30 10 14"
        stroke="#93c5fd"
        strokeWidth="1"
        opacity="0.6"
      />
      <Path
        d="M65 38 Q36 38 8 30"
        stroke="#93c5fd"
        strokeWidth="1"
        opacity="0.45"
      />
      <Path
        d="M65 35 Q80 12 122 8 Q126 22 112 36 Q96 44 65 40 Z"
        fill={`url(#${g})`}
        stroke="#bfdbfe"
        strokeWidth="1.5"
      />
      <Path
        d="M65 37 Q92 30 120 14"
        stroke="#93c5fd"
        strokeWidth="1"
        opacity="0.6"
      />
      <Path
        d="M65 38 Q94 38 122 30"
        stroke="#93c5fd"
        strokeWidth="1"
        opacity="0.45"
      />
    </Svg>
  );
}

export function Headphones({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.55);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 55">
      <Path
        d="M14 44 Q14 10 50 6 Q86 10 86 44"
        stroke="#18181b"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="14" cy="44" r="14" fill="#27272a" />
      <Circle cx="14" cy="44" r="10" fill="#3f3f46" />
      <Circle cx="14" cy="44" r="6" fill="#27272a" />
      <Circle cx="86" cy="44" r="14" fill="#27272a" />
      <Circle cx="86" cy="44" r="10" fill="#3f3f46" />
      <Circle cx="86" cy="44" r="6" fill="#27272a" />
      <Circle cx="20" cy="50" r="2" fill="#22c55e" />
    </Svg>
  );
}

export function Beret({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.62);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 62">
      <Rect x="18" y="46" width="64" height="14" rx="7" fill="#7c1f1f" />
      <Ellipse cx="54" cy="29" rx="42" ry="24" fill="#c0392b" />
      <Ellipse cx="44" cy="20" rx="18" ry="10" fill="#e05050" opacity="0.45" />
      <Circle cx="60" cy="10" r="4" fill="#922b21" />
      <Circle cx="60" cy="10" r="2" fill="#7c1f1f" />
    </Svg>
  );
}

export function BearHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.85);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 85">
      <Circle cx="18" cy="22" r="14" fill="#8b6914" />
      <Circle cx="18" cy="22" r="9" fill="#c4a35a" />
      <Circle cx="82" cy="22" r="14" fill="#8b6914" />
      <Circle cx="82" cy="22" r="9" fill="#c4a35a" />
      <Path d="M15 62 C14 36 22 12 50 9 C78 12 86 36 85 62 Z" fill="#a0762a" />
      <Rect x="15" y="58" width="70" height="27" rx="7" fill="#7a5a1a" />
      <Path
        d="M15 66 Q50 69 85 66"
        stroke="#60440e"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M15 74 Q50 77 85 74"
        stroke="#60440e"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </Svg>
  );
}

export function CatEars({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.52);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 52">
      <Rect x="8" y="32" width="84" height="14" rx="7" fill="#18181b" />
      <Polygon points="20,30 9,4 34,18" fill="#18181b" />
      <Polygon points="20,27 13,9 30,19" fill="#fda4af" />
      <Polygon points="80,30 66,18 91,4" fill="#18181b" />
      <Polygon points="80,27 70,19 87,9" fill="#fda4af" />
    </Svg>
  );
}

export function TruckerHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.68);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 68">
      <Path d="M50 10 C78 16 88 38 82 58 L50 58 Z" fill="#e5e7eb" />
      <Circle cx="70" cy="24" r="2.5" fill="#9ca3af" opacity="0.6" />
      <Circle cx="78" cy="34" r="2.5" fill="#9ca3af" opacity="0.6" />
      <Circle cx="80" cy="46" r="2.5" fill="#9ca3af" opacity="0.6" />
      <Circle cx="64" cy="34" r="2.5" fill="#9ca3af" opacity="0.6" />
      <Circle cx="72" cy="46" r="2.5" fill="#9ca3af" opacity="0.6" />
      <Path d="M18 58 C14 38 22 16 50 10 L50 58 Z" fill="#dc2626" />
      <Rect x="22" y="28" width="24" height="18" rx="3" fill="#b91c1c" />
      <Ellipse cx="50" cy="59" rx="46" ry="11" fill="#111111" />
      <Circle cx="50" cy="11" r="4" fill="#b91c1c" />
      <Circle cx="50" cy="11" r="2" fill="#991b1b" />
    </Svg>
  );
}

export function JesterHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.92);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 92">
      <Path d="M20 56 Q8 36 18 6 Q28 30 36 52 Z" fill="#7c3aed" />
      <Circle cx="18" cy="6" r="7" fill="#fbbf24" />
      <Path d="M36 56 Q50 18 50 2 Q64 18 64 56 Z" fill="#dc2626" />
      <Circle cx="50" cy="2" r="7" fill="#fbbf24" />
      <Path d="M80 56 Q92 36 82 6 Q72 30 64 52 Z" fill="#7c3aed" />
      <Circle cx="82" cy="6" r="7" fill="#fbbf24" />
      <Rect x="12" y="54" width="76" height="20" rx="6" fill="#1c1c1e" />
      <Rect x="12" y="54" width="26" height="20" rx="4" fill="#7c3aed" />
      <Rect x="62" y="54" width="26" height="20" rx="4" fill="#dc2626" />
      <Rect x="12" y="72" width="76" height="20" rx="6" fill="#111111" />
    </Svg>
  );
}

export function TopHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.95);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 95">
      <Ellipse cx="50" cy="74" rx="48" ry="12" fill="#111111" />
      <Ellipse cx="50" cy="72" rx="44" ry="9" fill="#1a1a1a" />
      <Rect x="22" y="12" width="56" height="62" rx="4" fill="#111111" />
      <Rect
        x="24"
        y="12"
        width="8"
        height="62"
        rx="4"
        fill="#1e1e1e"
        opacity="0.7"
      />
      <Rect x="22" y="62" width="56" height="10" rx="2" fill="#7c3aed" />
      <Ellipse cx="50" cy="13" rx="28" ry="6" fill="#1a1a1a" />
    </Svg>
  );
}

export function PartyHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 1.0);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 100">
      <Path d="M18 72 L50 4 L82 72 Z" fill="#ec4899" />
      <Path d="M26 57 L50 4 L62 32 Z" fill="#7c3aed" opacity="0.7" />
      <Circle cx="36" cy="46" r="4" fill="white" opacity="0.7" />
      <Circle cx="66" cy="38" r="3" fill="white" opacity="0.6" />
      <Circle cx="48" cy="62" r="3.5" fill="#fde68a" opacity="0.75" />
      <Circle cx="64" cy="60" r="3" fill="white" opacity="0.6" />
      <Path d="M18 72 Q50 80 82 72 Q50 82 18 72 Z" fill="#db2777" />
      <Circle cx="50" cy="4" r="5" fill="#fbbf24" />
    </Svg>
  );
}

export function FlowerCrown({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.55);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 55">
      <Rect x="10" y="34" width="80" height="14" rx="7" fill="#16a34a" />
      <Circle cx="22" cy="26" r="10" fill="#f472b6" />
      <Circle cx="22" cy="26" r="5" fill="#fde68a" />
      <Circle cx="40" cy="18" r="10" fill="#fb923c" />
      <Circle cx="40" cy="18" r="5" fill="#fde68a" />
      <Circle cx="60" cy="18" r="10" fill="#f472b6" />
      <Circle cx="60" cy="18" r="5" fill="#fde68a" />
      <Circle cx="78" cy="26" r="10" fill="#fb923c" />
      <Circle cx="78" cy="26" r="5" fill="#fde68a" />
      <Ellipse cx="22" cy="17" rx="4" ry="6" fill="#4ade80" opacity="0.8" />
      <Ellipse cx="50" cy="12" rx="4" ry="6" fill="#4ade80" opacity="0.8" />
      <Ellipse cx="78" cy="17" rx="4" ry="6" fill="#4ade80" opacity="0.8" />
    </Svg>
  );
}

export function ChefHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.85);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 85">
      <Rect x="20" y="62" width="60" height="20" rx="4" fill="#e5e7eb" />
      <Path
        d="M20 66 Q40 60 60 60 Q80 60 80 66"
        stroke="#d1d5db"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M22 40 C14 30 14 10 30 8 C38 6 44 14 50 14 C56 14 62 6 70 8 C86 10 86 30 78 40 Z"
        fill="white"
      />
      <Ellipse cx="50" cy="40" rx="28" ry="10" fill="white" />
      <Path
        d="M22 40 C14 30 14 10 30 8"
        stroke="#e5e7eb"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M78 40 C86 30 86 10 70 8"
        stroke="#e5e7eb"
        strokeWidth="2"
        fill="none"
      />
    </Svg>
  );
}

export function SafariHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.65);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 65">
      <Ellipse cx="50" cy="54" rx="48" ry="10" fill="#92400e" />
      <Ellipse cx="50" cy="51" rx="40" ry="8" fill="#a16207" />
      <Ellipse cx="50" cy="32" rx="34" ry="26" fill="#ca8a04" />
      <Ellipse cx="50" cy="28" rx="30" ry="20" fill="#d97706" />
      <Ellipse cx="42" cy="22" rx="12" ry="8" fill="#fbbf24" opacity="0.3" />
      <Rect x="20" y="48" width="60" height="8" rx="3" fill="#92400e" />
      <Circle cx="50" cy="10" r="3" fill="#78350f" />
    </Svg>
  );
}

export function WitchHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 1.02);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 100">
      <Path d="M10 76 L50 4 L90 76 Z" fill="#18181b" />
      <Ellipse cx="50" cy="78" rx="48" ry="14" fill="#111111" />
      <Ellipse cx="50" cy="76" rx="40" ry="8" fill="#1a1a1a" />
      <Rect x="16" y="68" width="68" height="10" rx="2" fill="#7c3aed" />
      <Circle cx="36" cy="70" r="3" fill="#fbbf24" />
      <Circle cx="64" cy="70" r="3" fill="#fbbf24" />
      <Path
        d="M36 46 Q40 36 44 26"
        stroke="#27272a"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M64 46 Q60 36 56 26"
        stroke="#27272a"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </Svg>
  );
}

export function HardHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.62);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 62">
      <Ellipse cx="50" cy="50" rx="48" ry="10" fill="#ca8a04" />
      <Path d="M12 50 C10 28 24 10 50 8 C76 10 90 28 88 50 Z" fill="#eab308" />
      <Rect x="22" y="44" width="56" height="10" rx="3" fill="#ca8a04" />
      <Ellipse cx="40" cy="26" rx="12" ry="6" fill="#fde047" opacity="0.4" />
      <Rect x="42" y="8" width="16" height="6" rx="2" fill="#ca8a04" />
    </Svg>
  );
}

// ─── MORE GLASSES ─────────────────────────────────────────────────────────────

export function StarGlasses({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.45);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 45">
      <Path
        d="M0 22 L10 22"
        stroke="#fbbf24"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M100 22 L110 22"
        stroke="#fbbf24"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M46 22 L64 22"
        stroke="#fbbf24"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Polygon
        points="23,6 26,16 36,16 28,22 31,32 23,26 15,32 18,22 10,16 20,16"
        fill="#fbbf24"
      />
      <Polygon
        points="87,6 90,16 100,16 92,22 95,32 87,26 79,32 82,22 74,16 84,16"
        fill="#fbbf24"
      />
    </Svg>
  );
}

export function CatEyeGlasses({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.4);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 40">
      <Path d="M0 24 L6 24" stroke="#18181b" strokeWidth="2.5" fill="none" />
      <Path
        d="M104 24 L110 24"
        stroke="#18181b"
        strokeWidth="2.5"
        fill="none"
      />
      <Path d="M47 20 L63 20" stroke="#18181b" strokeWidth="2.5" fill="none" />
      <Path
        d="M6 26 Q8 10 28 8 Q46 6 47 20 Q46 30 28 32 Q10 34 6 26 Z"
        fill="#ddd6fe"
        opacity="0.4"
      />
      <Path
        d="M6 26 Q8 10 28 8 Q46 6 47 20 Q46 30 28 32 Q10 34 6 26 Z"
        fill="none"
        stroke="#18181b"
        strokeWidth="3"
      />
      <Path
        d="M104 26 Q102 10 82 8 Q64 6 63 20 Q64 30 82 32 Q100 34 104 26 Z"
        fill="#ddd6fe"
        opacity="0.4"
      />
      <Path
        d="M104 26 Q102 10 82 8 Q64 6 63 20 Q64 30 82 32 Q100 34 104 26 Z"
        fill="none"
        stroke="#18181b"
        strokeWidth="3"
      />
    </Svg>
  );
}

export function VisorGlasses({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.38);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 38">
      <Path
        d="M5 8 Q55 2 105 8 Q108 30 55 36 Q2 30 5 8 Z"
        fill="#06b6d4"
        opacity="0.65"
      />
      <Path
        d="M8 10 Q55 5 102 10 Q80 8 55 7 Q30 8 8 10 Z"
        fill="white"
        opacity="0.4"
      />
      <Path
        d="M5 8 Q55 2 105 8"
        stroke="#0e7490"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M0 10 L5 10" stroke="#0e7490" strokeWidth="3" fill="none" />
      <Path d="M105 10 L110 10" stroke="#0e7490" strokeWidth="3" fill="none" />
    </Svg>
  );
}

export function AviatorGlasses({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.42);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 42">
      <Path d="M0 20 L8 20" stroke="#a16207" strokeWidth="3" fill="none" />
      <Path d="M102 20 L110 20" stroke="#a16207" strokeWidth="3" fill="none" />
      <Path d="M46 22 L64 22" stroke="#a16207" strokeWidth="2.5" fill="none" />
      <Path
        d="M8 20 Q10 6 28 5 Q46 4 46 20 Q46 34 28 35 Q8 34 8 20 Z"
        fill="#92400e"
        opacity="0.35"
      />
      <Path
        d="M8 20 Q10 6 28 5 Q46 4 46 20 Q46 34 28 35 Q8 34 8 20 Z"
        fill="none"
        stroke="#a16207"
        strokeWidth="3"
      />
      <Path
        d="M102 20 Q100 6 82 5 Q64 4 64 20 Q64 34 82 35 Q102 34 102 20 Z"
        fill="#92400e"
        opacity="0.35"
      />
      <Path
        d="M102 20 Q100 6 82 5 Q64 4 64 20 Q64 34 82 35 Q102 34 102 20 Z"
        fill="none"
        stroke="#a16207"
        strokeWidth="3"
      />
    </Svg>
  );
}

export function Glasses3D({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.4);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 40">
      <Path d="M0 20 L8 20" stroke="#18181b" strokeWidth="2.5" fill="none" />
      <Path
        d="M102 20 L110 20"
        stroke="#18181b"
        strokeWidth="2.5"
        fill="none"
      />
      <Path d="M46 20 L64 20" stroke="#18181b" strokeWidth="2.5" fill="none" />
      <Rect
        x="8"
        y="8"
        width="38"
        height="24"
        rx="5"
        fill="#ef4444"
        opacity="0.6"
      />
      <Rect
        x="8"
        y="8"
        width="38"
        height="24"
        rx="5"
        fill="none"
        stroke="#18181b"
        strokeWidth="2.5"
      />
      <Rect
        x="64"
        y="8"
        width="38"
        height="24"
        rx="5"
        fill="#06b6d4"
        opacity="0.6"
      />
      <Rect
        x="64"
        y="8"
        width="38"
        height="24"
        rx="5"
        fill="none"
        stroke="#18181b"
        strokeWidth="2.5"
      />
    </Svg>
  );
}

export function Monocle({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.44);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 44">
      <Path
        d="M102 16 L110 16"
        stroke="#a16207"
        strokeWidth="2.5"
        fill="none"
      />
      <Circle cx="82" cy="22" r="18" fill="#92400e" opacity="0.3" />
      <Circle
        cx="82"
        cy="22"
        r="18"
        fill="none"
        stroke="#a16207"
        strokeWidth="3"
      />
      <Path
        d="M82 40 Q82 44 78 44"
        stroke="#a16207"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M78 44 Q60 50 50 44"
        stroke="#a16207"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="3,3"
      />
    </Svg>
  );
}

// ─── MORE OUTFITS ─────────────────────────────────────────────────────────────

export function BowTie({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.42);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 42">
      <Path
        d="M10 5 L44 18 L44 24 L10 37 Q2 30 2 21 Q2 12 10 5 Z"
        fill="#dc2626"
      />
      <Path
        d="M90 5 L56 18 L56 24 L90 37 Q98 30 98 21 Q98 12 90 5 Z"
        fill="#dc2626"
      />
      <Ellipse cx="50" cy="21" rx="12" ry="10" fill="#b91c1c" />
      <Path
        d="M14 10 Q29 16 44 21"
        stroke="#ef4444"
        strokeWidth="2"
        opacity="0.4"
        fill="none"
      />
      <Path
        d="M86 10 Q71 16 56 21"
        stroke="#ef4444"
        strokeWidth="2"
        opacity="0.4"
        fill="none"
      />
    </Svg>
  );
}

export function Scarf({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.65);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 65">
      <Path d="M18 6 Q50 2 82 6 L84 28 Q50 32 16 28 Z" fill="#3b82f6" />
      <Path
        d="M16 16 Q50 20 84 16 Q50 24 16 16 Z"
        fill="#1d4ed8"
        opacity="0.6"
      />
      <Path d="M18 28 L12 65 Q19 67 26 65 L30 28 Z" fill="#3b82f6" />
      <Path
        d="M14 38 Q20 40 28 38"
        stroke="#1d4ed8"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Path
        d="M12 52 Q19 54 28 52"
        stroke="#1d4ed8"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Path
        d="M12 63 L11 66 M15 64 L15 67 M18 64 L18 67 M21 64 L21 67 M24 63 L25 66"
        stroke="#93c5fd"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Cape({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const w = Math.round(size * 1.15);
  const h = Math.round(size * 0.85);
  return (
    <Svg width={w} height={h} viewBox="0 0 130 85">
      <Path
        d="M46 10 Q20 30 8 85 Q65 78 122 85 Q110 30 84 10 Z"
        fill="#b91c1c"
      />
      <Path
        d="M52 18 Q22 38 12 82 Q65 75 118 82 Q108 38 78 18 Z"
        fill="white"
        opacity="0.08"
      />
      <Path d="M44 8 Q65 2 86 8 Q86 24 65 28 Q44 24 44 8 Z" fill="#dc2626" />
      <Circle cx="65" cy="10" r="5" fill="#fbbf24" />
      <Circle cx="65" cy="10" r="2.5" fill="#f59e0b" />
    </Svg>
  );
}

export function GoldChain({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.55);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 55">
      <Path
        d="M10 10 Q50 46 90 10"
        stroke="#fbbf24"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M10 10 Q50 46 90 10"
        stroke="#fde68a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="7,5"
      />
      <Circle cx="50" cy="43" r="9" fill="#f59e0b" />
      <Circle cx="50" cy="43" r="6" fill="#fbbf24" />
      <Circle cx="50" cy="43" r="3" fill="#f59e0b" />
    </Svg>
  );
}

export function Overalls({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.9);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 90">
      <Rect x="10" y="38" width="80" height="52" rx="5" fill="#1d4ed8" />
      <Path d="M50 40 L50 90" stroke="#1e40af" strokeWidth="2" />
      <Rect x="10" y="78" width="35" height="12" rx="3" fill="#1e3a8a" />
      <Rect x="55" y="78" width="35" height="12" rx="3" fill="#1e3a8a" />
      <Rect x="28" y="8" width="44" height="36" rx="4" fill="#1d4ed8" />
      <Rect x="34" y="14" width="32" height="22" rx="3" fill="#1e40af" />
      <Rect x="37" y="17" width="26" height="16" rx="2" fill="#1d4ed8" />
      <Path d="M28 10 Q20 0 12 0 L10 0 L10 12 L22 12 Z" fill="#1d4ed8" />
      <Path d="M72 10 Q80 0 88 0 L90 0 L90 12 L78 12 Z" fill="#1d4ed8" />
      <Circle cx="12" cy="4" r="3.5" fill="#fbbf24" />
      <Circle cx="88" cy="4" r="3.5" fill="#fbbf24" />
    </Svg>
  );
}

export function Dress({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.92);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 92">
      <Path
        d="M22 18 L2 15 L0 42 L22 40 Z"
        fill="#a855f7"
        stroke="#9333ea"
        strokeWidth="1"
      />
      <Path
        d="M78 18 L98 15 L100 42 L78 40 Z"
        fill="#a855f7"
        stroke="#9333ea"
        strokeWidth="1"
      />
      <Path d="M28 12 Q50 5 72 12 L78 40 Q50 50 22 40 Z" fill="#a855f7" />
      <Path d="M28 12 Q50 6 72 12 Q58 10 50 10 Q42 10 28 12 Z" fill="#9333ea" />
      <Path
        d="M22 40 Q0 60 4 92 Q50 98 96 92 Q100 60 78 40 Q50 50 22 40 Z"
        fill="#c084fc"
      />
      <Path
        d="M22 40 Q0 58 5 88 Q50 94 95 88 Q100 58 78 40 Q50 48 22 40 Z"
        fill="#a855f7"
        opacity="0.4"
      />
      <Path
        d="M38 26 Q50 22 62 26"
        stroke="#e9d5ff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
    </Svg>
  );
}

export function Suit({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.85);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 85">
      <Path
        d="M22 18 L2 14 L0 44 L22 42 Z"
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1"
      />
      <Path
        d="M78 18 L98 14 L100 44 L78 42 Z"
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1"
      />
      <Rect x="18" y="16" width="64" height="69" rx="4" fill="#1e293b" />
      <Path d="M36 16 L30 8 Q50 4 70 8 L64 16 L50 26 Z" fill="#0f172a" />
      <Path
        d="M36 16 L30 8 Q38 10 50 10 Q62 10 70 8 L64 16"
        fill="#334155"
        opacity="0.5"
      />
      <Path d="M50 26 L50 85" stroke="#0f172a" strokeWidth="2" />
      <Rect x="34" y="55" width="14" height="8" rx="2" fill="#0f172a" />
      <Rect x="52" y="55" width="14" height="8" rx="2" fill="#0f172a" />
      <Path
        d="M48 36 Q50 32 52 36 Q54 40 52 44 Q50 46 48 44 Q46 40 48 36 Z"
        fill="#dc2626"
      />
    </Svg>
  );
}

export function Raincoat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.88);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 88">
      <Path
        d="M22 18 L2 14 L0 44 L22 42 Z"
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="1"
      />
      <Path
        d="M78 18 L98 14 L100 44 L78 42 Z"
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="1"
      />
      <Rect x="18" y="14" width="64" height="74" rx="5" fill="#fbbf24" />
      <Path d="M36 14 L32 6 Q50 2 68 6 L64 14" fill="#d97706" />
      <Path d="M50 14 L50 88" stroke="#d97706" strokeWidth="2" />
      <Rect x="34" y="32" width="12" height="6" rx="2" fill="#d97706" />
      <Rect x="34" y="44" width="12" height="6" rx="2" fill="#d97706" />
      <Rect x="34" y="56" width="12" height="6" rx="2" fill="#d97706" />
      <Rect x="22" y="74" width="56" height="14" rx="4" fill="#d97706" />
      <Ellipse cx="72" cy="36" rx="6" ry="4" fill="#fde68a" opacity="0.6" />
    </Svg>
  );
}

export function Sweater({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.78);
  const g = `sw${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 78">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f9a8d4" />
          <Stop offset="1" stopColor="#ec4899" />
        </LinearGradient>
      </Defs>
      {/* Left sleeve */}
      <Path
        d="M22 22 L2 16 L0 44 L22 42 Z"
        fill="#f472b6"
        stroke="#ec4899"
        strokeWidth="1"
      />
      {/* Sleeve ribbed cuff left */}
      <Path d="M0 38 L22 40" stroke="#db2777" strokeWidth="3" />
      {/* Right sleeve */}
      <Path
        d="M78 22 L98 16 L100 44 L78 42 Z"
        fill="#f472b6"
        stroke="#ec4899"
        strokeWidth="1"
      />
      {/* Sleeve ribbed cuff right */}
      <Path d="M100 38 L78 40" stroke="#db2777" strokeWidth="3" />
      {/* Body */}
      <Rect x="18" y="18" width="64" height="60" rx="5" fill={`url(#${g})`} />
      {/* Round collar */}
      <Path d="M36 18 Q50 30 64 18" fill="#ec4899" />
      <Path
        d="M36 18 Q50 28 64 18"
        stroke="#db2777"
        strokeWidth="2"
        fill="none"
      />
      {/* Knit texture */}
      <Path
        d="M18 32 Q50 28 82 32"
        stroke="#db2777"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
        strokeDasharray="5,3"
      />
      <Path
        d="M18 42 Q50 38 82 42"
        stroke="#db2777"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
        strokeDasharray="5,3"
      />
      <Path
        d="M18 52 Q50 48 82 52"
        stroke="#db2777"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
        strokeDasharray="5,3"
      />
      <Path
        d="M18 62 Q50 58 82 62"
        stroke="#db2777"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
        strokeDasharray="5,3"
      />
      {/* Ribbed hem */}
      <Rect x="18" y="71" width="64" height="7" rx="3" fill="#ec4899" />
      {/* Highlight */}
      <Path
        d="M24 26 Q36 22 44 24"
        stroke="#fce7f3"
        strokeWidth="3"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── BOTTOMS ──────────────────────────────────────────────────────────────────

export function Jeans({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.72);
  const g = `jn${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 72">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2563eb" />
          <Stop offset="1" stopColor="#1e40af" />
        </LinearGradient>
      </Defs>
      {/* Waistband */}
      <Rect x="4" y="0" width="92" height="12" rx="4" fill="#1e3a8a" />
      {/* Belt loops */}
      <Rect x="16" y="0" width="5" height="10" rx="2" fill="#1e40af" />
      <Rect x="40" y="0" width="5" height="10" rx="2" fill="#1e40af" />
      <Rect x="55" y="0" width="5" height="10" rx="2" fill="#1e40af" />
      <Rect x="79" y="0" width="5" height="10" rx="2" fill="#1e40af" />
      {/* Left leg — full length to ankle */}
      <Path d="M4 10 L8 72 L46 72 L50 10 Z" fill={`url(#${g})`} />
      {/* Right leg */}
      <Path d="M50 10 L54 72 L92 72 L96 10 Z" fill={`url(#${g})`} />
      {/* Center seam */}
      <Path d="M50 10 L50 72" stroke="#1e40af" strokeWidth="2" />
      {/* Left pocket */}
      <Path
        d="M8 12 Q20 24 30 16"
        stroke="#1e3a8a"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Right pocket */}
      <Path
        d="M92 12 Q80 24 70 16"
        stroke="#1e3a8a"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Fly stitch */}
      <Path
        d="M48 10 L48 22 Q50 24 52 22 L52 10"
        stroke="#1e3a8a"
        strokeWidth="1"
        fill="none"
      />
      {/* Denim fade/texture */}
      <Path
        d="M10 30 Q30 26 46 30"
        stroke="#60a5fa"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
      <Path
        d="M54 30 Q70 26 90 30"
        stroke="#60a5fa"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
      {/* Knee highlight */}
      <Ellipse cx="27" cy="44" rx="10" ry="8" fill="#3b82f6" opacity="0.2" />
      <Ellipse cx="73" cy="44" rx="10" ry="8" fill="#3b82f6" opacity="0.2" />
      {/* Ankle cuff */}
      <Path
        d="M8 68 L46 68"
        stroke="#1e3a8a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M54 68 L92 68"
        stroke="#1e3a8a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Shorts({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.38);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 38">
      {/* Waistband */}
      <Rect x="4" y="0" width="92" height="11" rx="4" fill="#374151" />
      {/* Drawstring */}
      <Path
        d="M38 5 Q50 8 62 5"
        stroke="#6b7280"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left leg */}
      <Path d="M4 9 L8 38 L47 38 L50 9 Z" fill="#4b5563" />
      {/* Right leg */}
      <Path d="M50 9 L53 38 L92 38 L96 9 Z" fill="#4b5563" />
      {/* Center seam */}
      <Path d="M50 9 L50 38" stroke="#374151" strokeWidth="2" />
      {/* Pocket outlines */}
      <Path
        d="M8 11 Q20 22 28 16"
        stroke="#374151"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M92 11 Q80 22 72 16"
        stroke="#374151"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Hem */}
      <Path
        d="M8 36 Q28 32 47 36"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M53 36 Q72 32 92 36"
        stroke="#374151"
        strokeWidth="2"
        fill="none"
      />
    </Svg>
  );
}

export function MiniSkirt({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.48);
  const g = `ms${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 48">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#27272a" />
          <Stop offset="1" stopColor="#111113" />
        </LinearGradient>
      </Defs>
      {/* Waistband */}
      <Rect x="18" y="0" width="64" height="10" rx="4" fill="#18181b" />
      {/* Pleated A-line skirt */}
      <Path
        d="M18 8 Q0 22 2 48 Q50 54 98 48 Q100 22 82 8 Z"
        fill={`url(#${g})`}
      />
      {/* Pleat lines */}
      <Path
        d="M30 8 Q26 28 24 46"
        stroke="#3f3f46"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M40 8 Q38 28 37 46"
        stroke="#3f3f46"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M50 8 L50 48"
        stroke="#3f3f46"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M60 8 Q62 28 63 46"
        stroke="#3f3f46"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M70 8 Q74 28 76 46"
        stroke="#3f3f46"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      {/* Hem */}
      <Path
        d="M2 46 Q50 52 98 46"
        stroke="#3f3f46"
        strokeWidth="2"
        fill="none"
      />
      {/* Waistband highlight */}
      <Path
        d="M20 4 Q50 2 80 4"
        stroke="#52525b"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
    </Svg>
  );
}

export function CargoPants({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.5);
  const g = `cp${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 50">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c2a86a" />
          <Stop offset="1" stopColor="#a08040" />
        </LinearGradient>
      </Defs>
      {/* Waistband */}
      <Rect x="4" y="0" width="92" height="12" rx="4" fill="#78603a" />
      {/* Belt loops */}
      <Rect x="15" y="0" width="5" height="10" rx="2" fill="#8a7048" />
      <Rect x="40" y="0" width="5" height="10" rx="2" fill="#8a7048" />
      <Rect x="55" y="0" width="5" height="10" rx="2" fill="#8a7048" />
      <Rect x="80" y="0" width="5" height="10" rx="2" fill="#8a7048" />
      {/* Left leg */}
      <Path d="M4 10 L9 50 L46 50 L50 10 Z" fill={`url(#${g})`} />
      {/* Right leg */}
      <Path d="M50 10 L54 50 L91 50 L96 10 Z" fill={`url(#${g})`} />
      {/* Center seam */}
      <Path d="M50 10 L50 50" stroke="#78603a" strokeWidth="2" />
      {/* Left cargo pocket */}
      <Rect
        x="9"
        y="18"
        width="24"
        height="20"
        rx="3"
        fill="#a08040"
        stroke="#78603a"
        strokeWidth="1.5"
      />
      <Path
        d="M9 26 Q21 28 33 26"
        stroke="#78603a"
        strokeWidth="1.5"
        fill="none"
      />
      <Rect
        x="18"
        y="18"
        width="6"
        height="6"
        rx="1"
        fill="#78603a"
        opacity="0.5"
      />
      {/* Right cargo pocket */}
      <Rect
        x="67"
        y="18"
        width="24"
        height="20"
        rx="3"
        fill="#a08040"
        stroke="#78603a"
        strokeWidth="1.5"
      />
      <Path
        d="M67 26 Q79 28 91 26"
        stroke="#78603a"
        strokeWidth="1.5"
        fill="none"
      />
      <Rect
        x="76"
        y="18"
        width="6"
        height="6"
        rx="1"
        fill="#78603a"
        opacity="0.5"
      />
    </Svg>
  );
}

export function Leggings({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.5);
  const g = `lg${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 50">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#1a1a1a" />
          <Stop offset="0.5" stopColor="#2d2d2d" />
          <Stop offset="1" stopColor="#1a1a1a" />
        </LinearGradient>
      </Defs>
      {/* High waistband */}
      <Rect x="4" y="0" width="92" height="12" rx="5" fill="#0a0a0a" />
      {/* Waistband fold */}
      <Path d="M4 6 Q50 8 96 6" stroke="#222" strokeWidth="2" fill="none" />
      {/* Left leg - tight */}
      <Path d="M4 10 L8 50 L48 50 L50 10 Z" fill={`url(#${g})`} />
      {/* Right leg */}
      <Path d="M50 10 L52 50 L92 50 L96 10 Z" fill={`url(#${g})`} />
      {/* Center seam */}
      <Path d="M50 10 L50 50" stroke="#2a2a2a" strokeWidth="1.5" />
      {/* Sheen highlights - left leg */}
      <Path
        d="M16 10 Q12 30 11 50"
        stroke="#4a4a4a"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M22 10 Q20 30 19 50"
        stroke="#5a5a5a"
        strokeWidth="1"
        fill="none"
        opacity="0.35"
      />
      {/* Sheen highlights - right leg */}
      <Path
        d="M80 10 Q84 30 85 50"
        stroke="#4a4a4a"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M74 10 Q76 30 77 50"
        stroke="#5a5a5a"
        strokeWidth="1"
        fill="none"
        opacity="0.35"
      />
      {/* Ankle detail */}
      <Path d="M8 48 Q28 46 48 48" stroke="#222" strokeWidth="2" fill="none" />
      <Path d="M52 48 Q72 46 92 48" stroke="#222" strokeWidth="2" fill="none" />
    </Svg>
  );
}

export function Sweatpants({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.52);
  const g = `sp${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 52">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2d2d30" />
          <Stop offset="1" stopColor="#1a1a1c" />
        </LinearGradient>
      </Defs>
      {/* Elastic waistband */}
      <Rect x="4" y="0" width="92" height="13" rx="6" fill="#1a1a1c" />
      {/* Waistband ribs */}
      <Path
        d="M4 5 Q50 7 96 5"
        stroke="#2d2d30"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      <Path
        d="M4 9 Q50 11 96 9"
        stroke="#2d2d30"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      {/* Drawstring */}
      <Path
        d="M38 6 Q50 9 62 6"
        stroke="#6b7280"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="38" cy="6" r="3" fill="#374151" />
      <Circle cx="62" cy="6" r="3" fill="#374151" />
      {/* Left leg - relaxed fit */}
      <Path d="M4 11 L7 52 L46 52 L50 11 Z" fill={`url(#${g})`} />
      {/* Right leg */}
      <Path d="M50 11 L54 52 L93 52 L96 11 Z" fill={`url(#${g})`} />
      {/* Center seam */}
      <Path d="M50 11 L50 50" stroke="#111" strokeWidth="1.5" />
      {/* Tapered ankle cuffs */}
      <Rect x="7" y="45" width="39" height="7" rx="3.5" fill="#111" />
      <Rect x="54" y="45" width="39" height="7" rx="3.5" fill="#111" />
      {/* Highlight */}
      <Path
        d="M10 18 Q30 14 44 16"
        stroke="#444"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── SHOES ────────────────────────────────────────────────────────────────────

export function Sneakers({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.62);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 62">
      {/* LEFT SHOE */}
      {/* Ankle / sock cuff */}
      <Rect x="8" y="0" width="28" height="12" rx="4" fill="#e5e7eb" />
      <Path
        d="M8 6 Q22 4 36 6"
        stroke="#d1d5db"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Upper body */}
      <Path
        d="M4 50 Q4 28 16 22 L32 22 Q42 24 44 36 L44 50 Z"
        fill="#f9fafb"
        stroke="#e5e7eb"
        strokeWidth="1"
      />
      {/* Tongue */}
      <Path
        d="M16 22 L18 50 L26 50 L26 22 Z"
        fill="#f3f4f6"
        stroke="#e5e7eb"
        strokeWidth="0.8"
      />
      {/* Laces */}
      <Path
        d="M16 26 L26 26 M15 31 L27 31 M15 36 L27 36 M16 41 L26 41"
        stroke="#6b7280"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Nike-style swoosh */}
      <Path d="M26 38 Q36 32 44 40 Q38 40 30 41 Z" fill="#0ea5e9" />
      {/* Chunky sole */}
      <Rect x="0" y="50" width="44" height="10" rx="5" fill="#e5e7eb" />
      <Rect x="0" y="54" width="44" height="6" rx="3" fill="#d1d5db" />
      <Path
        d="M0 50 Q22 48 44 50"
        stroke="#0ea5e9"
        strokeWidth="2.5"
        fill="none"
      />
      {/* RIGHT SHOE */}
      <Rect x="64" y="0" width="28" height="12" rx="4" fill="#e5e7eb" />
      <Path
        d="M64 6 Q78 4 92 6"
        stroke="#d1d5db"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M56 36 Q58 24 68 22 L84 22 Q96 24 96 50 L56 50 Z"
        fill="#f9fafb"
        stroke="#e5e7eb"
        strokeWidth="1"
      />
      <Path
        d="M74 22 L74 50 L82 50 L84 22 Z"
        fill="#f3f4f6"
        stroke="#e5e7eb"
        strokeWidth="0.8"
      />
      <Path
        d="M74 26 L84 26 M73 31 L85 31 M73 36 L85 36 M74 41 L84 41"
        stroke="#6b7280"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M70 38 Q62 32 56 40 Q62 40 70 41 Z" fill="#0ea5e9" />
      <Rect x="56" y="50" width="44" height="10" rx="5" fill="#e5e7eb" />
      <Rect x="56" y="54" width="44" height="6" rx="3" fill="#d1d5db" />
      <Path
        d="M56 50 Q78 48 100 50"
        stroke="#0ea5e9"
        strokeWidth="2.5"
        fill="none"
      />
    </Svg>
  );
}

export function Boots({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.52);
  const g = `bt${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 52">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#3b1f0a" />
          <Stop offset="0.5" stopColor="#5a2e0e" />
          <Stop offset="1" stopColor="#3b1f0a" />
        </LinearGradient>
      </Defs>
      {/* LEFT BOOT */}
      {/* Boot shaft */}
      <Path
        d="M4 2 L4 32 Q4 40 12 40 Q20 40 24 32 L26 2 Z"
        fill={`url(#${g})`}
      />
      {/* Lace eyelets and laces */}
      <Circle cx="8" cy="6" r="1.5" fill="#6b3a1a" />
      <Circle cx="22" cy="6" r="1.5" fill="#6b3a1a" />
      <Circle cx="8" cy="12" r="1.5" fill="#6b3a1a" />
      <Circle cx="22" cy="12" r="1.5" fill="#6b3a1a" />
      <Circle cx="8" cy="18" r="1.5" fill="#6b3a1a" />
      <Circle cx="22" cy="18" r="1.5" fill="#6b3a1a" />
      <Circle cx="8" cy="24" r="1.5" fill="#6b3a1a" />
      <Circle cx="22" cy="24" r="1.5" fill="#6b3a1a" />
      <Path
        d="M8 6 L22 6 M8 12 L22 12 M8 18 L22 18 M8 24 L22 24"
        stroke="#c8a880"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Sole */}
      <Rect x="0" y="36" width="30" height="9" rx="4.5" fill="#1a0d04" />
      <Path d="M24 36 Q30 40 28 48 L0 48 Q2 42 0 38" fill="#1a0d04" />
      {/* Leather highlight */}
      <Path
        d="M8 4 Q15 2 20 4"
        stroke="#7a4020"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* RIGHT BOOT */}
      <Path
        d="M74 2 L74 32 Q74 40 82 40 Q90 40 94 32 L96 2 Z"
        fill={`url(#${g})`}
      />
      <Circle cx="78" cy="6" r="1.5" fill="#6b3a1a" />
      <Circle cx="92" cy="6" r="1.5" fill="#6b3a1a" />
      <Circle cx="78" cy="12" r="1.5" fill="#6b3a1a" />
      <Circle cx="92" cy="12" r="1.5" fill="#6b3a1a" />
      <Circle cx="78" cy="18" r="1.5" fill="#6b3a1a" />
      <Circle cx="92" cy="18" r="1.5" fill="#6b3a1a" />
      <Circle cx="78" cy="24" r="1.5" fill="#6b3a1a" />
      <Circle cx="92" cy="24" r="1.5" fill="#6b3a1a" />
      <Path
        d="M78 6 L92 6 M78 12 L92 12 M78 18 L92 18 M78 24 L92 24"
        stroke="#c8a880"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <Rect x="70" y="36" width="30" height="9" rx="4.5" fill="#1a0d04" />
      <Path d="M94 36 Q100 40 98 48 L70 48 Q72 42 70 38" fill="#1a0d04" />
      <Path
        d="M78 4 Q85 2 90 4"
        stroke="#7a4020"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
    </Svg>
  );
}

export function HighTops({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.52);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 52">
      {/* LEFT HIGH TOP */}
      {/* High ankle upper */}
      <Rect x="2" y="6" width="40" height="36" rx="5" fill="#1c1c1e" />
      {/* Sole */}
      <Rect x="2" y="38" width="40" height="10" rx="5" fill="#0a0a0a" />
      <Path d="M28 38 Q44 44 42 52 L2 52 Q0 46 2 38" fill="#0a0a0a" />
      {/* Tongue tab */}
      <Rect x="13" y="6" width="18" height="22" rx="3" fill="#2a2a2e" />
      {/* Lace holes on sides */}
      <Circle cx="6" cy="10" r="1.5" fill="#444" />
      <Circle cx="6" cy="16" r="1.5" fill="#444" />
      <Circle cx="6" cy="22" r="1.5" fill="#444" />
      <Circle cx="6" cy="28" r="1.5" fill="#444" />
      <Circle cx="6" cy="34" r="1.5" fill="#444" />
      {/* Laces - crisscross */}
      <Path
        d="M6 10 L22 13 M6 16 L22 17 M6 22 L22 21 M6 28 L22 25 M6 34 L22 29"
        stroke="#e5e7eb"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Star logo patch */}
      <Circle cx="30" cy="22" r="7" fill="#f5f5f5" opacity="0.9" />
      <Polygon
        points="30,17 31,20.5 34.5,20.5 31.8,22.5 32.8,26 30,24 27.2,26 28.2,22.5 25.5,20.5 29,20.5"
        fill="#1c1c1e"
      />
      {/* RIGHT HIGH TOP */}
      <Rect x="58" y="6" width="40" height="36" rx="5" fill="#1c1c1e" />
      <Rect x="58" y="38" width="40" height="10" rx="5" fill="#0a0a0a" />
      <Path d="M84 38 Q100 44 98 52 L58 52 Q56 46 58 38" fill="#0a0a0a" />
      <Rect x="69" y="6" width="18" height="22" rx="3" fill="#2a2a2e" />
      <Circle cx="94" cy="10" r="1.5" fill="#444" />
      <Circle cx="94" cy="16" r="1.5" fill="#444" />
      <Circle cx="94" cy="22" r="1.5" fill="#444" />
      <Circle cx="94" cy="28" r="1.5" fill="#444" />
      <Circle cx="94" cy="34" r="1.5" fill="#444" />
      <Path
        d="M94 10 L78 13 M94 16 L78 17 M94 22 L78 21 M94 28 L78 25 M94 34 L78 29"
        stroke="#e5e7eb"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <Circle cx="70" cy="22" r="7" fill="#f5f5f5" opacity="0.9" />
      <Polygon
        points="70,17 71,20.5 74.5,20.5 71.8,22.5 72.8,26 70,24 67.2,26 68.2,22.5 65.5,20.5 69,20.5"
        fill="#1c1c1e"
      />
    </Svg>
  );
}

export function Slides({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.3);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 30">
      {/* LEFT SLIDE */}
      {/* Flat sole */}
      <Rect x="0" y="20" width="44" height="10" rx="5" fill="#1a1a1c" />
      {/* Sole highlight */}
      <Path
        d="M2 22 Q22 20 42 22"
        stroke="#333"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Wide strap */}
      <Path
        d="M4 20 Q6 10 10 8 L34 8 Q38 10 40 20 Z"
        fill="#1c1c1e"
        stroke="#333"
        strokeWidth="1"
      />
      {/* Strap highlight */}
      <Path
        d="M8 14 Q22 10 36 14"
        stroke="#3a3a3e"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* Logo emboss */}
      <Path
        d="M14 18 Q22 15 30 18"
        stroke="#2a2a2e"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      {/* RIGHT SLIDE */}
      <Rect x="56" y="20" width="44" height="10" rx="5" fill="#1a1a1c" />
      <Path
        d="M58 22 Q78 20 98 22"
        stroke="#333"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M60 20 Q62 10 66 8 L90 8 Q94 10 96 20 Z"
        fill="#1c1c1e"
        stroke="#333"
        strokeWidth="1"
      />
      <Path
        d="M64 14 Q78 10 92 14"
        stroke="#3a3a3e"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      <Path
        d="M70 18 Q78 15 86 18"
        stroke="#2a2a2e"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
    </Svg>
  );
}

export function Heels({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.44);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 44">
      <Path
        d="M2 20 Q4 10 18 8 Q32 6 36 20 L36 30 Q36 38 26 38 Q10 38 2 30 Z"
        fill="#ec4899"
      />
      <Path d="M36 28 L38 44 Q32 44 30 30 Z" fill="#be185d" />
      <Path
        d="M4 24 Q18 20 34 24"
        stroke="#be185d"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M8 16 Q18 10 30 16"
        stroke="#be185d"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M64 20 Q66 10 80 8 Q94 6 98 20 L98 30 Q98 38 88 38 Q72 38 64 30 Z"
        fill="#ec4899"
      />
      <Path d="M98 28 L100 44 Q94 44 92 30 Z" fill="#be185d" />
      <Path
        d="M66 24 Q80 20 96 24"
        stroke="#be185d"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M70 16 Q80 10 92 16"
        stroke="#be185d"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── BAGS ─────────────────────────────────────────────────────────────────────

export function Backpack({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.92);
  const g = `bp${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 92">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#27272a" />
          <Stop offset="1" stopColor="#111113" />
        </LinearGradient>
      </Defs>
      {/* Shoulder straps */}
      <Rect x="26" y="2" width="14" height="26" rx="7" fill="#1a1a1c" />
      <Rect x="60" y="2" width="14" height="26" rx="7" fill="#1a1a1c" />
      {/* Main body */}
      <Rect x="10" y="14" width="80" height="74" rx="14" fill={`url(#${g})`} />
      {/* Body outline */}
      <Rect
        x="10"
        y="14"
        width="80"
        height="74"
        rx="14"
        fill="none"
        stroke="#333"
        strokeWidth="1.5"
      />
      {/* Top handle */}
      <Rect
        x="38"
        y="10"
        width="24"
        height="8"
        rx="4"
        fill="#1a1a1c"
        stroke="#333"
        strokeWidth="1"
      />
      {/* Top zip pocket */}
      <Rect x="16" y="20" width="68" height="18" rx="7" fill="#1a1a1c" />
      <Path
        d="M22 29 Q50 25 78 29"
        stroke="#444"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="27" r="4" fill="#555" />
      {/* Main pocket zip */}
      <Path
        d="M16 44 Q50 40 84 44"
        stroke="#555"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="43" r="4" fill="#666" />
      {/* Front zip pocket */}
      <Rect
        x="20"
        y="55"
        width="60"
        height="28"
        rx="9"
        fill="#1c1c1e"
        stroke="#333"
        strokeWidth="1.5"
      />
      <Path
        d="M26 68 Q50 64 74 68"
        stroke="#444"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="67" r="3" fill="#555" />
      {/* Side pocket */}
      <Rect
        x="10"
        y="48"
        width="8"
        height="24"
        rx="4"
        fill="#1a1a1c"
        stroke="#333"
        strokeWidth="1"
      />
      {/* Highlight */}
      <Path
        d="M16 20 Q50 16 84 20"
        stroke="#3a3a3e"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </Svg>
  );
}

export function ToteBag({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.82);
  const g = `tb${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 82">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f5f0e8" />
          <Stop offset="1" stopColor="#e8dfc8" />
        </LinearGradient>
      </Defs>
      {/* Rope handles */}
      <Path
        d="M24 16 Q20 0 28 0 Q36 0 32 16"
        stroke="#a07830"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M68 16 Q64 0 72 0 Q80 0 76 16"
        stroke="#a07830"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Handle twist lines */}
      <Path
        d="M24 16 Q20 0 28 0 Q36 0 32 16"
        stroke="#c8a060"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="4,3"
      />
      <Path
        d="M68 16 Q64 0 72 0 Q80 0 76 16"
        stroke="#c8a060"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="4,3"
      />
      {/* Bag body */}
      <Path d="M10 14 Q8 82 10 82 L90 82 Q92 82 90 14 Z" fill={`url(#${g})`} />
      {/* Top fold */}
      <Rect x="8" y="10" width="84" height="10" rx="3" fill="#d4b870" />
      {/* "TOTE" text as graphic */}
      <Rect
        x="28"
        y="36"
        width="44"
        height="10"
        rx="2"
        fill="#c8a050"
        opacity="0.4"
      />
      <Rect
        x="30"
        y="38"
        width="8"
        height="6"
        rx="1"
        fill="#a07830"
        opacity="0.5"
      />
      <Rect
        x="40"
        y="38"
        width="8"
        height="6"
        rx="1"
        fill="#a07830"
        opacity="0.5"
      />
      <Rect
        x="50"
        y="38"
        width="8"
        height="6"
        rx="1"
        fill="#a07830"
        opacity="0.5"
      />
      <Rect
        x="60"
        y="38"
        width="8"
        height="6"
        rx="1"
        fill="#a07830"
        opacity="0.5"
      />
      {/* Seam lines */}
      <Path
        d="M10 14 Q8 48 10 82"
        stroke="#d4b870"
        strokeWidth="1"
        opacity="0.5"
      />
      <Path
        d="M90 14 Q92 48 90 82"
        stroke="#d4b870"
        strokeWidth="1"
        opacity="0.5"
      />
      <Path
        d="M14 78 Q50 80 86 78"
        stroke="#c8a060"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
    </Svg>
  );
}

export function CrossbodyBag({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.65);
  const g = `cb${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 65">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#27272a" />
          <Stop offset="1" stopColor="#111113" />
        </LinearGradient>
      </Defs>
      {/* Crossbody strap going up to right */}
      <Path
        d="M10 10 Q8 2 20 2"
        stroke="#333"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M90 0 Q100 0 100 8"
        stroke="#333"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M20 2 Q55 0 100 8"
        stroke="#444"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Main rectangular body */}
      <Rect x="10" y="8" width="80" height="54" rx="10" fill={`url(#${g})`} />
      {/* Body outline */}
      <Rect
        x="10"
        y="8"
        width="80"
        height="54"
        rx="10"
        fill="none"
        stroke="#3a3a3e"
        strokeWidth="1.5"
      />
      {/* Front flap */}
      <Path d="M10 8 Q10 30 50 32 Q90 30 90 8 Z" fill="#1a1a1c" />
      <Path
        d="M10 8 Q10 28 50 30 Q90 28 90 8"
        stroke="#333"
        strokeWidth="1"
        fill="none"
      />
      {/* Magnetic clasp */}
      <Circle cx="50" cy="30" r="7" fill="#3a3a3e" />
      <Circle cx="50" cy="30" r="4" fill="#52525b" />
      <Circle cx="50" cy="30" r="2" fill="#71717a" />
      {/* Card slots */}
      <Rect
        x="18"
        y="36"
        width="64"
        height="20"
        rx="6"
        fill="#1c1c1e"
        stroke="#333"
        strokeWidth="1"
      />
      <Path d="M18 46 L82 46" stroke="#333" strokeWidth="1" />
      {/* Highlight */}
      <Path
        d="M14 12 Q50 8 86 12"
        stroke="#3a3a3e"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </Svg>
  );
}

export function FannyPack({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.42);
  const g = `fp${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 42">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#27272a" />
          <Stop offset="1" stopColor="#111113" />
        </LinearGradient>
      </Defs>
      {/* Belt strap */}
      <Rect x="0" y="14" width="100" height="9" rx="4.5" fill="#1a1a1c" />
      {/* Buckle left */}
      <Rect x="0" y="12" width="16" height="13" rx="3" fill="#374151" />
      <Rect x="3" y="15" width="10" height="7" rx="2" fill="#4b5563" />
      {/* Buckle right */}
      <Rect x="84" y="12" width="16" height="13" rx="3" fill="#374151" />
      <Rect x="87" y="15" width="10" height="7" rx="2" fill="#4b5563" />
      {/* Main pouch body */}
      <Rect x="20" y="4" width="60" height="36" rx="10" fill={`url(#${g})`} />
      <Rect
        x="20"
        y="4"
        width="60"
        height="36"
        rx="10"
        fill="none"
        stroke="#333"
        strokeWidth="1.5"
      />
      {/* Front zip */}
      <Path
        d="M28 20 Q50 16 72 20"
        stroke="#444"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Zip pull */}
      <Rect x="46" y="17" width="8" height="5" rx="2" fill="#555" />
      {/* Logo strip */}
      <Rect x="26" y="28" width="48" height="6" rx="2" fill="#1a1a1c" />
      <Path
        d="M32 31 Q50 29 68 31"
        stroke="#3a3a3e"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      {/* Highlight */}
      <Path
        d="M24 8 Q50 6 76 8"
        stroke="#3a3a3e"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
    </Svg>
  );
}

// ─── NEW LOOKBOOK COMPONENTS ──────────────────────────────────────────────────

export function Snapback({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.65);
  const g = `snb${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 65">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#27272a" />
          <Stop offset="1" stopColor="#111113" />
        </LinearGradient>
      </Defs>
      {/* Crown */}
      <Path
        d="M18 52 C16 30 24 12 50 8 C76 12 84 30 82 52 Z"
        fill={`url(#${g})`}
      />
      {/* Panel seams */}
      <Path d="M50 8 L50 52" stroke="#333" strokeWidth="1" opacity="0.6" />
      <Path
        d="M34 10 Q32 32 26 52"
        stroke="#333"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <Path
        d="M66 10 Q68 32 74 52"
        stroke="#333"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Flat brim - distinctive snapback feature */}
      <Ellipse cx="50" cy="53" rx="46" ry="10" fill="#0a0a0b" />
      <Path d="M18 51 Q50 57 82 51" stroke="#222" strokeWidth="4" fill="none" />
      {/* Flat brim top line */}
      <Path
        d="M18 50 Q50 55 82 50"
        stroke="#333"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Snapback closure at back */}
      <Rect x="36" y="50" width="28" height="6" rx="2" fill="#1a1a1c" />
      <Path
        d="M40 53 L60 53"
        stroke="#444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Button */}
      <Circle cx="50" cy="9" r="4" fill="#3a3a3e" />
      <Circle cx="50" cy="9" r="2.5" fill="#555" />
      {/* Logo panel front */}
      <Rect x="30" y="16" width="40" height="30" rx="3" fill="#1e1e22" />
      {/* Logo - white/grey */}
      <Path
        d="M40 28 Q50 22 60 28"
        stroke="#9ca3af"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M40 33 Q50 29 60 33"
        stroke="#6b7280"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Highlight on crown */}
      <Path
        d="M24 22 Q38 18 50 18"
        stroke="#3e3e42"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StrawHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.7);
  const g1 = `sh1${_uid}`;
  const g2 = `sh2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 120 70">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fde68a" />
          <Stop offset="0.5" stopColor="#f59e0b" />
          <Stop offset="1" stopColor="#b45309" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d97706" />
          <Stop offset="1" stopColor="#92400e" />
        </LinearGradient>
      </Defs>
      {/* Wide brim shadow/bottom */}
      <Ellipse cx="60" cy="56" rx="56" ry="11" fill="#92400e" />
      {/* Wide brim top surface */}
      <Ellipse cx="60" cy="53" rx="54" ry="9" fill={`url(#${g2})`} />
      {/* Brim weave lines */}
      <Path
        d="M8 53 Q30 48 60 47 Q90 48 112 53"
        stroke="#b45309"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M14 55 Q35 51 60 50 Q85 51 106 55"
        stroke="#b45309"
        strokeWidth="1"
        fill="none"
        opacity="0.45"
      />
      <Path
        d="M6 57 Q30 53 60 52 Q90 53 114 57"
        stroke="#7c2d12"
        strokeWidth="1"
        fill="none"
        opacity="0.35"
      />
      {/* Crown dome */}
      <Path
        d="M30 50 C28 28 36 8 60 4 C84 8 92 28 90 50 Z"
        fill={`url(#${g1})`}
      />
      {/* Crown weave horizontal lines */}
      <Path
        d="M33 43 Q45 40 60 39 Q75 40 87 43"
        stroke="#b45309"
        strokeWidth="1.5"
        fill="none"
        opacity="0.55"
      />
      <Path
        d="M32 35 Q45 32 60 31 Q75 32 88 35"
        stroke="#b45309"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M33 27 Q46 24 60 23 Q74 24 87 27"
        stroke="#d97706"
        strokeWidth="1"
        fill="none"
        opacity="0.45"
      />
      <Path
        d="M36 19 Q48 16 60 15 Q72 16 84 19"
        stroke="#d97706"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <Path
        d="M41 11 Q52 8 60 7 Q68 8 79 11"
        stroke="#fbbf24"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      {/* Crown vertical weave lines */}
      <Path
        d="M42 50 L38 12"
        stroke="#b45309"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <Path d="M52 50 L50 8" stroke="#b45309" strokeWidth="0.8" opacity="0.3" />
      <Path d="M60 50 L60 4" stroke="#b45309" strokeWidth="0.8" opacity="0.3" />
      <Path d="M68 50 L70 8" stroke="#b45309" strokeWidth="0.8" opacity="0.3" />
      <Path
        d="M78 50 L82 12"
        stroke="#b45309"
        strokeWidth="0.8"
        opacity="0.3"
      />
      {/* Hat band ribbon */}
      <Path
        d="M32 48 Q46 44 60 43 Q74 44 88 48"
        stroke="#7c2d12"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M32 48 Q46 44 60 43 Q74 44 88 48"
        stroke="#dc2626"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Crown highlight */}
      <Path
        d="M40 30 Q52 26 62 28"
        stroke="#fde68a"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AnimalHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.92);
  const g = `ah${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 92">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fce7f3" />
          <Stop offset="1" stopColor="#f0d4e8" />
        </LinearGradient>
      </Defs>
      {/* Left bunny ear */}
      <Path
        d="M26 60 L22 8 Q30 0 36 8 L38 60 Z"
        fill={`url(#${g})`}
        stroke="#f9a8d4"
        strokeWidth="1"
      />
      {/* Left ear inner pink */}
      <Path d="M29 58 L26 12 Q30 6 34 12 L36 58 Z" fill="#f9a8d4" />
      {/* Right bunny ear */}
      <Path
        d="M62 60 L64 8 Q70 0 78 8 L74 60 Z"
        fill={`url(#${g})`}
        stroke="#f9a8d4"
        strokeWidth="1"
      />
      {/* Right ear inner pink */}
      <Path d="M66 58 L68 12 Q70 6 74 12 L72 58 Z" fill="#f9a8d4" />
      {/* Main beanie dome */}
      <Path
        d="M12 72 C10 48 18 26 50 20 C82 26 90 48 88 72 Z"
        fill={`url(#${g})`}
      />
      {/* Ribbed fold */}
      <Rect x="10" y="68" width="80" height="20" rx="9" fill="#f5d0ea" />
      {/* Fold ribs */}
      <Path d="M18 68 L18 88" stroke="#f9a8d4" strokeWidth="2" opacity="0.5" />
      <Path d="M28 68 L28 88" stroke="#f9a8d4" strokeWidth="2" opacity="0.5" />
      <Path d="M38 68 L38 88" stroke="#f9a8d4" strokeWidth="2" opacity="0.5" />
      <Path d="M48 68 L48 88" stroke="#f9a8d4" strokeWidth="2" opacity="0.5" />
      <Path d="M58 68 L58 88" stroke="#f9a8d4" strokeWidth="2" opacity="0.5" />
      <Path d="M68 68 L68 88" stroke="#f9a8d4" strokeWidth="2" opacity="0.5" />
      <Path d="M78 68 L78 88" stroke="#f9a8d4" strokeWidth="2" opacity="0.5" />
      {/* Face/dome details */}
      <Path
        d="M18 48 Q50 42 82 48"
        stroke="#f9a8d4"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* Pompom button */}
      <Circle cx="50" cy="22" r="7" fill="white" />
      <Circle cx="50" cy="22" r="4" fill="#fce7f3" />
    </Svg>
  );
}

export function HeadphonesHat({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.62);
  const g = `hp${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 62">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3f3f46" />
          <Stop offset="1" stopColor="#1c1c1e" />
        </LinearGradient>
      </Defs>
      {/* Headband arc - padded */}
      <Path
        d="M14 50 Q14 14 50 8 Q86 14 86 50"
        stroke="#111"
        strokeWidth="11"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M14 50 Q14 14 50 8 Q86 14 86 50"
        stroke="#27272a"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Headband center pad */}
      <Path
        d="M34 12 Q50 8 66 12"
        stroke="#3f3f46"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left ear cup outer */}
      <Circle cx="14" cy="50" r="16" fill="#18181b" />
      <Circle cx="14" cy="50" r="13" fill={`url(#${g})`} />
      {/* Left driver */}
      <Circle cx="14" cy="50" r="9" fill="#111" />
      <Circle cx="14" cy="50" r="6" fill="#1a1a1c" />
      <Circle cx="14" cy="50" r="3" fill="#0a0a0b" />
      {/* Right ear cup outer */}
      <Circle cx="86" cy="50" r="16" fill="#18181b" />
      <Circle cx="86" cy="50" r="13" fill={`url(#${g})`} />
      {/* Right driver */}
      <Circle cx="86" cy="50" r="9" fill="#111" />
      <Circle cx="86" cy="50" r="6" fill="#1a1a1c" />
      <Circle cx="86" cy="50" r="3" fill="#0a0a0b" />
      {/* LED dot - glowing green */}
      <Circle cx="22" cy="57" r="3" fill="#22c55e" />
      <Circle cx="22" cy="57" r="1.5" fill="#4ade80" />
    </Svg>
  );
}

export function SkiGoggles({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.46);
  const g = `skig${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 110 46">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#7c3aed" />
          <Stop offset="0.25" stopColor="#2563eb" />
          <Stop offset="0.5" stopColor="#059669" />
          <Stop offset="0.75" stopColor="#d97706" />
          <Stop offset="1" stopColor="#dc2626" />
        </LinearGradient>
      </Defs>
      {/* Foam padding outer frame */}
      <Path
        d="M6 23 Q16 4 55 4 Q94 4 104 23 Q94 42 55 42 Q16 42 6 23 Z"
        fill="#111"
      />
      {/* Foam pad rim */}
      <Path
        d="M8 23 Q17 7 55 7 Q93 7 102 23 Q93 39 55 39 Q17 39 8 23 Z"
        fill="#222"
      />
      {/* Iridescent lens */}
      <Path
        d="M12 23 Q20 11 55 11 Q90 11 98 23 Q90 35 55 35 Q20 35 12 23 Z"
        fill={`url(#${g})`}
        opacity="0.88"
      />
      {/* Lens glare */}
      <Path
        d="M18 16 Q40 11 58 14"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
      <Path
        d="M16 20 Q30 15 42 18"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.2"
        strokeLinecap="round"
      />
      {/* Nose bridge area */}
      <Path d="M50 23 Q55 20 60 23" stroke="#111" strokeWidth="2" fill="none" />
      {/* Strap sides */}
      <Rect x="0" y="16" width="7" height="14" rx="3.5" fill="#2a2a2e" />
      <Rect x="103" y="16" width="7" height="14" rx="3.5" fill="#2a2a2e" />
    </Svg>
  );
}

export function PrescriptionGlasses({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.32);
  return (
    <Svg width={size} height={h} viewBox="0 0 110 35">
      {/* Left temple arm */}
      <Path
        d="M4 17 L0 16"
        stroke="#3d3d3d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Left lens frame - thin wire rectangular */}
      <Rect
        x="4"
        y="6"
        width="44"
        height="22"
        rx="4"
        stroke="#2d2d2d"
        strokeWidth="2"
        fill="rgba(200,230,255,0.10)"
      />
      {/* Left lens tint - very light blue */}
      <Rect
        x="6"
        y="8"
        width="40"
        height="18"
        rx="3"
        fill="rgba(173,216,230,0.09)"
      />
      {/* Left lens glare */}
      <Path
        d="M8 11 Q16 8 24 10"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      {/* Nose bridge */}
      <Path
        d="M48 15 Q55 18 62 15"
        stroke="#2d2d2d"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right lens frame - thin wire rectangular */}
      <Rect
        x="62"
        y="6"
        width="44"
        height="22"
        rx="4"
        stroke="#2d2d2d"
        strokeWidth="2"
        fill="rgba(200,230,255,0.10)"
      />
      {/* Right lens tint */}
      <Rect
        x="64"
        y="8"
        width="40"
        height="18"
        rx="3"
        fill="rgba(173,216,230,0.09)"
      />
      {/* Right lens glare */}
      <Path
        d="M66 11 Q74 8 82 10"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      {/* Right temple arm */}
      <Path
        d="M106 17 L110 16"
        stroke="#3d3d3d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Frame corner reinforcement dots */}
      <Circle cx="8" cy="10" r="1.2" fill="#4a4a4a" opacity="0.7" />
      <Circle cx="44" cy="10" r="1.2" fill="#4a4a4a" opacity="0.7" />
      <Circle cx="66" cy="10" r="1.2" fill="#4a4a4a" opacity="0.7" />
      <Circle cx="102" cy="10" r="1.2" fill="#4a4a4a" opacity="0.7" />
    </Svg>
  );
}

export function Jacket({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.75);
  const g = `jk${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 75">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1e3a5f" />
          <Stop offset="1" stopColor="#0f2040" />
        </LinearGradient>
      </Defs>
      {/* Left sleeve */}
      <Path
        d="M22 18 L2 12 L0 46 L22 44 Z"
        fill="#1a3358"
        stroke="#1e4080"
        strokeWidth="1"
      />
      {/* Right sleeve */}
      <Path
        d="M78 18 L98 12 L100 46 L78 44 Z"
        fill="#1a3358"
        stroke="#1e4080"
        strokeWidth="1"
      />
      {/* Body */}
      <Rect x="18" y="14" width="64" height="61" rx="5" fill={`url(#${g})`} />
      {/* Collar left */}
      <Path d="M36 14 L42 28 L50 14" fill="#122840" />
      {/* Collar right */}
      <Path d="M64 14 L58 28 L50 14" fill="#122840" />
      {/* Front zipper */}
      <Path d="M50 14 L50 75" stroke="#2a4a70" strokeWidth="2.5" />
      {/* Zipper teeth */}
      <Path
        d="M48 20 L52 20 M48 26 L52 26 M48 32 L52 32 M48 38 L52 38 M48 44 L52 44"
        stroke="#1e4080"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left chest pocket with flap */}
      <Rect
        x="20"
        y="32"
        width="22"
        height="14"
        rx="2"
        fill="#122840"
        stroke="#1e4080"
        strokeWidth="1"
      />
      <Rect x="20" y="32" width="22" height="5" rx="2" fill="#0f2040" />
      {/* Right chest pocket with flap */}
      <Rect
        x="58"
        y="32"
        width="22"
        height="14"
        rx="2"
        fill="#122840"
        stroke="#1e4080"
        strokeWidth="1"
      />
      <Rect x="58" y="32" width="22" height="5" rx="2" fill="#0f2040" />
      {/* Highlight */}
      <Path
        d="M22 20 Q36 16 44 18"
        stroke="#2a4a70"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* Bottom hem */}
      <Rect x="18" y="68" width="64" height="7" rx="3" fill="#122840" />
    </Svg>
  );
}

export function Flannel({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.72);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 72">
      {/* Left sleeve */}
      <Path
        d="M24 14 L4 8 L0 32 L24 30 Z"
        fill="#15803d"
        stroke="#166534"
        strokeWidth="1"
      />
      {/* Right sleeve */}
      <Path
        d="M76 14 L96 8 L100 32 L76 30 Z"
        fill="#15803d"
        stroke="#166534"
        strokeWidth="1"
      />
      {/* Body - green base */}
      <Rect x="20" y="12" width="60" height="60" rx="4" fill="#16a34a" />
      {/* Plaid horizontal stripes */}
      <Path
        d="M20 22 Q50 18 80 22 M20 32 Q50 28 80 32 M20 42 Q50 38 80 42 M20 52 Q50 48 80 52 M20 62 Q50 58 80 62"
        stroke="#166534"
        strokeWidth="5"
        fill="none"
        opacity="0.5"
      />
      {/* Plaid vertical stripes */}
      <Path
        d="M34 12 L34 72 M50 12 L50 72 M66 12 L66 72"
        stroke="#166534"
        strokeWidth="4"
        fill="none"
        opacity="0.45"
      />
      {/* Cross hatch darker accent */}
      <Path
        d="M20 27 Q50 23 80 27 M20 47 Q50 43 80 47 M20 67 Q50 63 80 67"
        stroke="#052e16"
        strokeWidth="2"
        fill="none"
        opacity="0.35"
      />
      <Path
        d="M42 12 L42 72 M58 12 L58 72"
        stroke="#052e16"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      {/* Collar with buttons */}
      <Path
        d="M36 12 Q42 24 50 12"
        stroke="#166534"
        strokeWidth="2.5"
        fill="none"
      />
      <Path
        d="M64 12 Q58 24 50 12"
        stroke="#166534"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Button placket */}
      <Path d="M50 12 L50 72" stroke="#166534" strokeWidth="2" opacity="0.6" />
      {/* Buttons */}
      <Circle cx="50" cy="22" r="2" fill="#052e16" opacity="0.7" />
      <Circle cx="50" cy="32" r="2" fill="#052e16" opacity="0.7" />
      <Circle cx="50" cy="42" r="2" fill="#052e16" opacity="0.7" />
      {/* Chest pocket */}
      <Rect
        x="56"
        y="20"
        width="16"
        height="14"
        rx="2"
        fill="#166534"
        stroke="#052e16"
        strokeWidth="1"
        opacity="0.7"
      />
    </Svg>
  );
}

export function DressShirt({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.72);
  const g1 = `drs1${_uid}`;
  const g2 = `drs2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 72">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#e2e8f0" />
          <Stop offset="0.5" stopColor="#f8fafc" />
          <Stop offset="1" stopColor="#e2e8f0" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#dde6f0" />
          <Stop offset="1" stopColor="#c8d8e8" />
        </LinearGradient>
      </Defs>
      {/* Left sleeve */}
      <Path
        d="M24 14 L4 8 L0 34 L24 30 Z"
        fill={`url(#${g2})`}
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      {/* Right sleeve */}
      <Path
        d="M76 14 L96 8 L100 34 L76 30 Z"
        fill={`url(#${g2})`}
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      {/* Body */}
      <Rect
        x="20"
        y="14"
        width="60"
        height="58"
        rx="4"
        fill={`url(#${g1})`}
        stroke="#e2e8f0"
        strokeWidth="1"
      />
      {/* Collar left flap */}
      <Path
        d="M34 14 L42 26 L50 14 Z"
        fill="#dde6f0"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      {/* Collar right flap */}
      <Path
        d="M66 14 L58 26 L50 14 Z"
        fill="#dde6f0"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      {/* Button placket */}
      <Rect x="47" y="26" width="6" height="46" rx="2" fill="#eef2f8" />
      <Path d="M50 14 L50 72" stroke="#cbd5e1" strokeWidth="1" opacity="0.6" />
      {/* Buttons */}
      <Circle
        cx="50"
        cy="30"
        r="2.5"
        fill="white"
        stroke="#94a3b8"
        strokeWidth="1.2"
      />
      <Circle
        cx="50"
        cy="40"
        r="2.5"
        fill="white"
        stroke="#94a3b8"
        strokeWidth="1.2"
      />
      <Circle
        cx="50"
        cy="50"
        r="2.5"
        fill="white"
        stroke="#94a3b8"
        strokeWidth="1.2"
      />
      <Circle
        cx="50"
        cy="60"
        r="2.5"
        fill="white"
        stroke="#94a3b8"
        strokeWidth="1.2"
      />
      {/* Button holes */}
      <Path
        d="M48 30 L52 30"
        stroke="#94a3b8"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <Path
        d="M48 40 L52 40"
        stroke="#94a3b8"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Chest pocket with flap */}
      <Rect
        x="59"
        y="22"
        width="17"
        height="16"
        rx="2"
        fill="#eef2f8"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      <Rect
        x="59"
        y="22"
        width="17"
        height="5"
        rx="2"
        fill="#dde6f0"
        stroke="#cbd5e1"
        strokeWidth="0.8"
      />
      {/* Pocket stitching */}
      <Path
        d="M61 34 L74 34"
        stroke="#94a3b8"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Sleeve cuff lines */}
      <Path d="M4 26 L22 24" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.6" />
      <Path
        d="M78 24 L96 26"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Body highlight */}
      <Path
        d="M24 20 Q36 17 44 18"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TankTop({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.68);
  const g1 = `tt1${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 68">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#e8e0d0" />
          <Stop offset="0.5" stopColor="#faf6ee" />
          <Stop offset="1" stopColor="#e8e0d0" />
        </LinearGradient>
      </Defs>
      {/* Left thin strap */}
      <Rect x="32" y="0" width="8" height="18" rx="4" fill="#d9d0be" />
      {/* Right thin strap */}
      <Rect x="60" y="0" width="8" height="18" rx="4" fill="#d9d0be" />
      {/* Main body - wide, cream/white */}
      <Path
        d="M22 16 L28 16 Q32 16 32 14 L32 0 L40 0 L40 14 Q40 16 44 16 L56 16 Q60 16 60 14 L60 0 L68 0 L68 14 Q68 16 72 16 L78 16 L78 68 L22 68 Z"
        fill={`url(#${g1})`}
      />
      {/* Neckline scoop */}
      <Path
        d="M40 0 Q50 10 60 0"
        stroke="#c8bfaa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Side seams */}
      <Path
        d="M22 16 L22 68"
        stroke="#d9d0be"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <Path
        d="M78 16 L78 68"
        stroke="#d9d0be"
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Hem at bottom */}
      <Path
        d="M22 63 Q50 66 78 63"
        stroke="#c8bfaa"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      {/* Armhole curves */}
      <Path
        d="M22 16 Q28 24 32 28"
        stroke="#d9d0be"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M78 16 Q72 24 68 28"
        stroke="#d9d0be"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Highlight down center */}
      <Path
        d="M46 16 L46 62"
        stroke="white"
        strokeWidth="4"
        opacity="0.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SweaterVest({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.72);
  const g1 = `sv1${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 72">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2563eb" />
          <Stop offset="1" stopColor="#1e3a8a" />
        </LinearGradient>
      </Defs>
      {/* Main body - V-neck vest shape */}
      <Path
        d="M28 14 L22 72 L78 72 L72 14 L58 14 L50 32 L42 14 Z"
        fill={`url(#${g1})`}
      />
      {/* Armhole cutouts (light to show shape) */}
      <Path d="M28 14 L22 38" stroke="#1e3a8a" strokeWidth="1.5" />
      <Path d="M72 14 L78 38" stroke="#1e3a8a" strokeWidth="1.5" />
      {/* Argyle diamond grid — navy diagonals */}
      <Path
        d="M50 32 L34 48 L50 64 L66 48 Z"
        stroke="#1e3a8a"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      <Path
        d="M50 32 L34 48 L50 64 L66 48 Z"
        stroke="#93c5fd"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
      />
      <Path
        d="M38 36 L26 48 L38 60 L50 48 Z"
        stroke="#1e3a8a"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M62 36 L74 48 L62 60 L50 48 Z"
        stroke="#1e3a8a"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />
      {/* Argyle cross lines */}
      <Path
        d="M34 48 L66 48"
        stroke="#93c5fd"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <Path
        d="M50 32 L50 64"
        stroke="#93c5fd"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <Path
        d="M34 36 L66 60"
        stroke="#93c5fd"
        strokeWidth="0.8"
        opacity="0.35"
      />
      <Path
        d="M66 36 L34 60"
        stroke="#93c5fd"
        strokeWidth="0.8"
        opacity="0.35"
      />
      {/* Small diamonds at argyle intersections */}
      <Path d="M50 32 L52 36 L50 40 L48 36 Z" fill="#93c5fd" opacity="0.6" />
      <Path d="M34 48 L36 52 L34 56 L32 52 Z" fill="#93c5fd" opacity="0.5" />
      <Path d="M66 48 L68 52 L66 56 L64 52 Z" fill="#93c5fd" opacity="0.5" />
      <Path d="M50 64 L52 68 L50 72 L48 68 Z" fill="#93c5fd" opacity="0.5" />
      {/* V-neck collar ribbing */}
      <Path
        d="M28 14 L42 14 L50 32 L58 14 L72 14"
        fill="#1e3a8a"
        stroke="#1d4ed8"
        strokeWidth="1"
      />
      <Path d="M28 14 L42 14" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
      <Path d="M58 14 L72 14" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
      {/* Shoulder ribbing */}
      <Rect x="22" y="10" width="56" height="5" rx="2" fill="#1e3a8a" />
      <Path
        d="M24 12 Q50 10 76 12"
        stroke="#3b82f6"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Bottom hem ribbing */}
      <Rect x="22" y="67" width="56" height="5" rx="2" fill="#1e3a8a" />
      <Path
        d="M22 69 Q50 68 78 69 M22 71 Q50 70 78 71"
        stroke="#3b82f6"
        strokeWidth="0.8"
        opacity="0.4"
      />
    </Svg>
  );
}

export function SwimTrunks({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.42);
  const g1 = `swt1${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 42">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0ea5e9" />
          <Stop offset="1" stopColor="#0369a1" />
        </LinearGradient>
      </Defs>
      {/* Waistband */}
      <Rect x="4" y="0" width="92" height="10" rx="5" fill="#0369a1" />
      {/* Waistband drawstring */}
      <Path
        d="M36 4 Q50 8 64 4"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="7" r="2" fill="#bae6fd" />
      {/* Left leg */}
      <Path d="M4 8 L8 42 L48 42 L50 8 Z" fill={`url(#${g1})`} />
      {/* Right leg */}
      <Path d="M50 8 L52 42 L92 42 L96 8 Z" fill={`url(#${g1})`} />
      {/* Center seam */}
      <Path d="M50 8 L50 42" stroke="#0284c7" strokeWidth="2" />
      {/* Tropical flower prints - left leg */}
      <Circle cx="20" cy="22" r="5" fill="#38bdf8" opacity="0.5" />
      <Path
        d="M20 17 L20 22 M15 22 L20 22 M25 22 L20 22 M20 27 L20 22"
        stroke="#7dd3fc"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <Circle cx="20" cy="22" r="2" fill="#bae6fd" opacity="0.8" />
      <Circle cx="32" cy="34" r="4" fill="#38bdf8" opacity="0.45" />
      <Path
        d="M32 30 L32 34 M28 34 L32 34 M36 34 L32 34 M32 38 L32 34"
        stroke="#7dd3fc"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Circle cx="32" cy="34" r="1.5" fill="#bae6fd" opacity="0.75" />
      {/* Tropical flower prints - right leg */}
      <Circle cx="72" cy="22" r="5" fill="#38bdf8" opacity="0.5" />
      <Path
        d="M72 17 L72 22 M67 22 L72 22 M77 22 L72 22 M72 27 L72 22"
        stroke="#7dd3fc"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <Circle cx="72" cy="22" r="2" fill="#bae6fd" opacity="0.8" />
      <Circle cx="82" cy="34" r="4" fill="#38bdf8" opacity="0.45" />
      <Path
        d="M82 30 L82 34 M78 34 L82 34 M86 34 L82 34 M82 38 L82 34"
        stroke="#7dd3fc"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Circle cx="82" cy="34" r="1.5" fill="#bae6fd" opacity="0.75" />
      {/* Side stripe accent */}
      <Rect
        x="4"
        y="8"
        width="4"
        height="34"
        rx="2"
        fill="#0284c7"
        opacity="0.5"
      />
      <Rect
        x="92"
        y="8"
        width="4"
        height="34"
        rx="2"
        fill="#0284c7"
        opacity="0.5"
      />
    </Svg>
  );
}

export function Sandals({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.35);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 35">
      {/* LEFT SANDAL */}
      {/* Footbed/sole */}
      <Ellipse cx="21" cy="30" rx="21" ry="5" fill="#c8a45a" />
      <Ellipse cx="21" cy="28" rx="19" ry="4" fill="#d4b060" />
      {/* Thong strap */}
      <Path
        d="M15 28 L21 14 L27 28"
        stroke="#a07830"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Side straps */}
      <Path
        d="M2 24 Q10 20 18 24"
        stroke="#a07830"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M24 24 Q32 20 40 24"
        stroke="#a07830"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Toe straps */}
      <Path
        d="M6 28 Q14 24 22 28"
        stroke="#b08840"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* RIGHT SANDAL */}
      <Ellipse cx="79" cy="30" rx="21" ry="5" fill="#c8a45a" />
      <Ellipse cx="79" cy="28" rx="19" ry="4" fill="#d4b060" />
      <Path
        d="M73 28 L79 14 L85 28"
        stroke="#a07830"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M60 24 Q68 20 76 24"
        stroke="#a07830"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M82 24 Q90 20 98 24"
        stroke="#a07830"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M64 28 Q72 24 80 28"
        stroke="#b08840"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SnowBoots({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.52);
  const g = `sb${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 52">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7c3aed" />
          <Stop offset="1" stopColor="#4c1d95" />
        </LinearGradient>
      </Defs>
      {/* LEFT SNOW BOOT */}
      {/* Insulated shaft */}
      <Path
        d="M4 2 L4 30 Q4 38 14 38 Q22 38 26 30 L28 2 Z"
        fill={`url(#${g})`}
      />
      {/* Laces */}
      <Path
        d="M8 8 L24 8 M8 14 L24 14 M8 20 L24 20"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Sole - chunky */}
      <Rect x="0" y="34" width="32" height="12" rx="6" fill="#2e1065" />
      <Path d="M26 34 Q34 40 30 52 L0 52 Q2 44 0 36" fill="#2e1065" />
      {/* Sole grip lines */}
      <Path
        d="M2 40 L30 40 M2 44 L30 44 M2 48 L30 48"
        stroke="#4c1d95"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* Fur trim at top */}
      <Ellipse cx="16" cy="3" rx="13" ry="4" fill="#ede9fe" />
      <Path d="M3 3 Q16 7 29 3 Q16 9 3 3 Z" fill="#ddd6fe" />
      {/* Boot highlight */}
      <Path
        d="M8 10 Q14 6 20 8"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      {/* RIGHT SNOW BOOT */}
      <Path
        d="M72 2 L72 30 Q72 38 82 38 Q90 38 94 30 L96 2 Z"
        fill={`url(#${g})`}
      />
      <Path
        d="M76 8 L92 8 M76 14 L92 14 M76 20 L92 20"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="68" y="34" width="32" height="12" rx="6" fill="#2e1065" />
      <Path d="M94 34 Q102 40 98 52 L68 52 Q70 44 68 36" fill="#2e1065" />
      <Path
        d="M70 40 L98 40 M70 44 L98 44 M70 48 L98 48"
        stroke="#4c1d95"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <Ellipse cx="84" cy="3" rx="13" ry="4" fill="#ede9fe" />
      <Path d="M71 3 Q84 7 97 3 Q84 9 71 3 Z" fill="#ddd6fe" />
      <Path
        d="M76 10 Q82 6 88 8"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function DressShoes({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.35);
  const g = `ds${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 35">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#27272a" />
          <Stop offset="1" stopColor="#09090b" />
        </LinearGradient>
      </Defs>
      {/* LEFT OXFORD */}
      {/* Rounded toe upper */}
      <Path
        d="M2 16 Q2 4 16 2 Q32 0 42 14 L42 24 Q42 30 28 30 Q8 30 2 24 Z"
        fill={`url(#${g})`}
      />
      {/* Heel */}
      <Path d="M42 22 Q48 30 44 35 L32 35 Q34 28 42 22 Z" fill="#09090b" />
      {/* Leather shine */}
      <Path
        d="M6 10 Q16 6 28 8"
        stroke="#52525b"
        strokeWidth="2.5"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      <Path
        d="M8 16 Q18 12 30 14"
        stroke="#52525b"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      {/* Sole edge */}
      <Path
        d="M2 24 Q22 28 42 24"
        stroke="#09090b"
        strokeWidth="3"
        fill="none"
      />
      {/* RIGHT OXFORD */}
      <Path
        d="M58 16 Q58 4 72 2 Q88 0 98 14 L98 24 Q98 30 84 30 Q64 30 58 24 Z"
        fill={`url(#${g})`}
      />
      <Path d="M98 22 Q104 30 100 35 L88 35 Q90 28 98 22 Z" fill="#09090b" />
      <Path
        d="M62 10 Q72 6 84 8"
        stroke="#52525b"
        strokeWidth="2.5"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      <Path
        d="M64 16 Q74 12 86 14"
        stroke="#52525b"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      <Path
        d="M58 24 Q78 28 98 24"
        stroke="#09090b"
        strokeWidth="3"
        fill="none"
      />
    </Svg>
  );
}

export function LaptopBag({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.88);
  const g1 = `lb1${_uid}`;
  const g2 = `lb2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 88">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#475569" />
          <Stop offset="1" stopColor="#1e293b" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#334155" />
          <Stop offset="1" stopColor="#475569" />
        </LinearGradient>
      </Defs>
      {/* Shoulder strap (diagonal) */}
      <Path d="M76 6 Q88 0 94 4 L92 10 Q84 8 74 14 Z" fill="#334155" />
      <Path
        d="M80 6 Q88 3 92 6"
        stroke="#64748b"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Main body - rectangular messenger bag */}
      <Rect x="6" y="10" width="80" height="64" rx="8" fill={`url(#${g1})`} />
      {/* Front flap */}
      <Rect x="6" y="10" width="80" height="36" rx="8" fill={`url(#${g2})`} />
      <Path d="M6 40 L86 40" stroke="#1e293b" strokeWidth="1" opacity="0.5" />
      {/* Flap edge stitching */}
      <Rect
        x="10"
        y="14"
        width="72"
        height="28"
        rx="5"
        fill="none"
        stroke="#64748b"
        strokeWidth="1.5"
        strokeDasharray="4,3"
        opacity="0.5"
      />
      {/* Front pocket on flap */}
      <Rect
        x="18"
        y="20"
        width="56"
        height="18"
        rx="4"
        fill="#1e293b"
        stroke="#334155"
        strokeWidth="1"
      />
      {/* Magnetic clasp */}
      <Rect x="40" y="42" width="20" height="6" rx="3" fill="#94a3b8" />
      <Circle
        cx="50"
        cy="45"
        r="3"
        fill="#64748b"
        stroke="#475569"
        strokeWidth="1"
      />
      <Circle cx="50" cy="45" r="1.5" fill="#94a3b8" />
      {/* Bottom section pockets */}
      <Rect
        x="10"
        y="52"
        width="32"
        height="18"
        rx="4"
        fill="#334155"
        stroke="#475569"
        strokeWidth="1"
        opacity="0.8"
      />
      <Rect
        x="48"
        y="52"
        width="32"
        height="18"
        rx="4"
        fill="#334155"
        stroke="#475569"
        strokeWidth="1"
        opacity="0.8"
      />
      {/* Handle on top */}
      <Path
        d="M36 10 Q36 4 50 4 Q64 4 64 10"
        stroke="#475569"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M36 10 Q36 5 50 5 Q64 5 64 10"
        stroke="#64748b"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bottom feet */}
      <Circle cx="14" cy="76" r="4" fill="#0f172a" />
      <Circle cx="78" cy="76" r="4" fill="#0f172a" />
      {/* Body highlight */}
      <Path
        d="M10 16 Q50 12 82 16"
        stroke="#64748b"
        strokeWidth="2"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function GymBag({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.65);
  const g1 = `gb1${_uid}`;
  const g2 = `gb2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 65">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ef4444" />
          <Stop offset="1" stopColor="#991b1b" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#b91c1c" />
          <Stop offset="0.5" stopColor="#dc2626" />
          <Stop offset="1" stopColor="#b91c1c" />
        </LinearGradient>
      </Defs>
      {/* Bottom ellipse shadow */}
      <Ellipse cx="50" cy="56" rx="44" ry="8" fill="#7f1d1d" />
      {/* Main cylindrical body */}
      <Rect x="6" y="18" width="88" height="38" rx="16" fill={`url(#${g2})`} />
      {/* Left end cap */}
      <Ellipse cx="14" cy="37" rx="8" ry="19" fill="#b91c1c" />
      {/* Right end cap */}
      <Ellipse cx="86" cy="37" rx="8" ry="19" fill="#b91c1c" />
      {/* Top opening ellipse */}
      <Ellipse cx="50" cy="18" rx="44" ry="13" fill={`url(#${g1})`} />
      {/* Zipper line */}
      <Path
        d="M14 18 Q50 10 86 18"
        stroke="#7f1d1d"
        strokeWidth="2.5"
        fill="none"
      />
      <Path
        d="M14 18 Q50 10 86 18"
        stroke="#fca5a5"
        strokeWidth="1"
        fill="none"
        strokeDasharray="5,3"
        opacity="0.6"
      />
      {/* Zipper pull tab */}
      <Rect x="47" y="12" width="6" height="8" rx="2" fill="#991b1b" />
      <Rect x="48" y="8" width="4" height="5" rx="1" fill="#7f1d1d" />
      {/* Carrying handles on top */}
      <Path
        d="M34 18 Q34 8 50 8 Q66 8 66 18"
        stroke="#991b1b"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M34 18 Q34 10 50 10 Q66 10 66 18"
        stroke="#fca5a5"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Side pocket */}
      <Rect
        x="70"
        y="26"
        width="18"
        height="20"
        rx="5"
        fill="#b91c1c"
        stroke="#991b1b"
        strokeWidth="1.5"
      />
      <Path
        d="M70 36 L88 36"
        stroke="#7f1d1d"
        strokeWidth="1.5"
        strokeDasharray="3,2"
        opacity="0.7"
      />
      {/* Body highlight */}
      <Path
        d="M10 26 Q50 20 90 26"
        stroke="#f87171"
        strokeWidth="2"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
      {/* Strap rings */}
      <Circle
        cx="20"
        cy="54"
        r="4"
        fill="#7f1d1d"
        stroke="#fca5a5"
        strokeWidth="1.5"
      />
      <Circle
        cx="80"
        cy="54"
        r="4"
        fill="#7f1d1d"
        stroke="#fca5a5"
        strokeWidth="1.5"
      />
    </Svg>
  );
}

export function CameraAccessory({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.88);
  const g1 = `cam1${_uid}`;
  const g2 = `cam2${_uid}`;
  const g3 = `cam3${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 88">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4b5563" />
          <Stop offset="1" stopColor="#1f2937" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#374151" />
          <Stop offset="1" stopColor="#111827" />
        </LinearGradient>
        <LinearGradient id={g3} x1="0.3" y1="0.3" x2="1" y2="1">
          <Stop offset="0" stopColor="#4b5563" />
          <Stop offset="1" stopColor="#111827" />
        </LinearGradient>
      </Defs>
      {/* Camera strap loops */}
      <Rect x="10" y="18" width="6" height="10" rx="2" fill="#6b7280" />
      <Rect x="84" y="18" width="6" height="10" rx="2" fill="#6b7280" />
      {/* Camera body */}
      <Rect x="6" y="24" width="88" height="58" rx="10" fill={`url(#${g1})`} />
      {/* Top grip/pentaprism hump */}
      <Rect x="28" y="14" width="44" height="14" rx="6" fill="#374151" />
      {/* Hot shoe (top mount) */}
      <Rect x="42" y="12" width="16" height="4" rx="1" fill="#6b7280" />
      <Rect x="44" y="10" width="12" height="4" rx="1" fill="#4b5563" />
      {/* Mode dial */}
      <Circle
        cx="82"
        cy="18"
        r="7"
        fill="#374151"
        stroke="#6b7280"
        strokeWidth="1.5"
      />
      <Circle cx="82" cy="18" r="4" fill="#4b5563" />
      <Path
        d="M82 12 L82 14 M82 22 L82 24 M76 18 L78 18 M86 18 L88 18"
        stroke="#9ca3af"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Shutter button */}
      <Circle
        cx="60"
        cy="22"
        r="4"
        fill="#4b5563"
        stroke="#6b7280"
        strokeWidth="1"
      />
      <Circle cx="60" cy="22" r="2.5" fill="#374151" />
      {/* Viewfinder bump */}
      <Rect x="40" y="16" width="20" height="10" rx="3" fill="#374151" />
      {/* Lens barrel */}
      <Circle cx="40" cy="58" r="24" fill="#1f2937" />
      <Circle
        cx="40"
        cy="58"
        r="21"
        fill={`url(#${g2})`}
        stroke="#374151"
        strokeWidth="1"
      />
      <Circle cx="40" cy="58" r="17" fill="#111827" />
      <Circle cx="40" cy="58" r="13" fill={`url(#${g3})`} />
      <Circle cx="40" cy="58" r="9" fill="#0d1117" />
      <Circle cx="40" cy="58" r="5" fill="#1a2230" />
      {/* Lens glass reflection */}
      <Path
        d="M32 50 Q38 46 44 48"
        stroke="#6b7280"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      <Circle cx="34" cy="52" r="2" fill="#4b5563" opacity="0.3" />
      {/* Right side control buttons */}
      <Rect x="76" y="42" width="14" height="28" rx="5" fill="#374151" />
      <Circle cx="83" cy="50" r="4" fill="#4b5563" />
      <Circle cx="83" cy="62" r="4" fill="#4b5563" />
      <Rect
        x="78"
        y="70"
        width="10"
        height="3"
        rx="1.5"
        fill="#6b7280"
        opacity="0.6"
      />
      {/* Body highlight */}
      <Path
        d="M10 30 Q50 26 90 30"
        stroke="#6b7280"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Watch({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.82);
  const g1 = `wt1${_uid}`;
  const g2 = `wt2${_uid}`;
  const g3 = `wt3${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 60 49">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#78350f" />
          <Stop offset="1" stopColor="#451a03" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9ca3af" />
          <Stop offset="1" stopColor="#374151" />
        </LinearGradient>
        <LinearGradient id={g3} x1="0.3" y1="0.3" x2="1" y2="1">
          <Stop offset="0" stopColor="#1f2937" />
          <Stop offset="1" stopColor="#0d1117" />
        </LinearGradient>
      </Defs>
      {/* Leather strap - top segment */}
      <Rect x="20" y="0" width="20" height="13" rx="3" fill={`url(#${g1})`} />
      {/* Strap notch holes */}
      <Circle cx="30" cy="3" r="1.2" fill="#292524" />
      <Circle cx="30" cy="7" r="1.2" fill="#292524" />
      <Circle cx="30" cy="11" r="1.2" fill="#292524" />
      {/* Leather strap - bottom segment */}
      <Rect x="20" y="36" width="20" height="13" rx="3" fill={`url(#${g1})`} />
      {/* Buckle */}
      <Rect x="23" y="40" width="14" height="7" rx="2" fill="#9ca3af" />
      <Rect x="25" y="42" width="10" height="3" rx="1" fill="#6b7280" />
      <Rect x="29" y="40" width="2" height="7" rx="1" fill="#4b5563" />
      {/* Case */}
      <Rect x="6" y="10" width="48" height="29" rx="10" fill={`url(#${g2})`} />
      {/* Crown/winder */}
      <Rect x="54" y="20" width="6" height="9" rx="3" fill="#9ca3af" />
      {/* Watch face */}
      <Circle
        cx="30"
        cy="24.5"
        r="14"
        fill={`url(#${g3})`}
        stroke="#4b5563"
        strokeWidth="1.5"
      />
      {/* Hour markers */}
      <Rect x="29" y="12" width="2" height="4" rx="1" fill="#d1d5db" />
      <Rect x="29" y="33" width="2" height="4" rx="1" fill="#d1d5db" />
      <Rect x="17" y="23.5" width="4" height="2" rx="1" fill="#d1d5db" />
      <Rect x="39" y="23.5" width="4" height="2" rx="1" fill="#d1d5db" />
      {/* Minute markers */}
      <Rect x="29.5" y="13" width="1" height="2.5" rx="0.5" fill="#6b7280" />
      <Rect
        x="25"
        y="14.2"
        width="1"
        height="2.5"
        rx="0.5"
        fill="#6b7280"
        transform="rotate(-30 25 14.2)"
      />
      <Rect
        x="20.5"
        y="18"
        width="1"
        height="2.5"
        rx="0.5"
        fill="#6b7280"
        transform="rotate(-60 20.5 18)"
      />
      {/* Hour hand */}
      <Path
        d="M30 24.5 L30 16"
        stroke="#f9fafb"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <Path
        d="M30 24.5 L38 20"
        stroke="#f9fafb"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Second hand */}
      <Path
        d="M30 24.5 L26 32"
        stroke="#ef4444"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <Circle
        cx="30"
        cy="24.5"
        r="2"
        fill="#6b7280"
        stroke="#9ca3af"
        strokeWidth="0.5"
      />
    </Svg>
  );
}

export function Keychain({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.88);
  const g1 = `kc1${_uid}`;
  const g2 = `kc2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 50 44">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fde68a" />
          <Stop offset="1" stopColor="#d97706" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9ca3af" />
          <Stop offset="1" stopColor="#4b5563" />
        </LinearGradient>
      </Defs>
      {/* Main keyring - gold */}
      <Circle
        cx="25"
        cy="9"
        r="8"
        stroke={`url(#${g1})`}
        strokeWidth="3.5"
        fill="none"
      />
      {/* Keyring inner ring detail */}
      <Circle
        cx="25"
        cy="9"
        r="4.5"
        stroke="#d97706"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      {/* Ring highlight */}
      <Path
        d="M18 6 Q22 3 26 5"
        stroke="#fde68a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Key connector bar */}
      <Rect x="21" y="16" width="8" height="5" rx="2" fill={`url(#${g2})`} />
      {/* Key 1 - leftmost */}
      <Rect x="13" y="20" width="5" height="18" rx="2" fill={`url(#${g1})`} />
      {/* Key 1 bow (top round part) */}
      <Circle
        cx="15.5"
        cy="22"
        r="4"
        fill="none"
        stroke={`url(#${g1})`}
        strokeWidth="2.5"
      />
      <Circle cx="15.5" cy="22" r="1.5" fill="#d97706" />
      {/* Key 1 teeth */}
      <Rect x="13" y="30" width="3" height="2" rx="0.5" fill="#b45309" />
      <Rect x="13" y="34" width="4" height="2" rx="0.5" fill="#b45309" />
      {/* Key 2 - middle */}
      <Rect x="22" y="20" width="6" height="20" rx="2" fill={`url(#${g2})`} />
      {/* Key 2 bow */}
      <Circle
        cx="25"
        cy="23"
        r="4.5"
        fill="none"
        stroke={`url(#${g2})`}
        strokeWidth="2.5"
      />
      <Circle cx="25" cy="23" r="2" fill="#4b5563" />
      {/* Key 2 teeth */}
      <Rect x="22" y="31" width="4" height="2" rx="0.5" fill="#374151" />
      <Rect x="22" y="35" width="3" height="2" rx="0.5" fill="#374151" />
      {/* Key 3 - rightmost */}
      <Rect x="32" y="20" width="5" height="16" rx="2" fill={`url(#${g1})`} />
      {/* Key 3 bow */}
      <Circle
        cx="34.5"
        cy="22"
        r="4"
        fill="none"
        stroke={`url(#${g1})`}
        strokeWidth="2.5"
      />
      <Circle cx="34.5" cy="22" r="1.5" fill="#d97706" />
      {/* Key 3 teeth */}
      <Rect x="32" y="28" width="4" height="2" rx="0.5" fill="#b45309" />
      <Rect x="32" y="32" width="3" height="2" rx="0.5" fill="#b45309" />
    </Svg>
  );
}

export function WaterBottle({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.98);
  const g1 = `wb1${_uid}`;
  const g2 = `wb2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 50 49">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#0369a1" />
          <Stop offset="0.4" stopColor="#0ea5e9" />
          <Stop offset="1" stopColor="#0369a1" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#075985" />
          <Stop offset="0.5" stopColor="#0284c7" />
          <Stop offset="1" stopColor="#075985" />
        </LinearGradient>
      </Defs>
      {/* Lid/cap */}
      <Rect x="18" y="0" width="14" height="9" rx="4" fill={`url(#${g2})`} />
      {/* Lid highlight */}
      <Path
        d="M19 3 Q25 1 31 3"
        stroke="#38bdf8"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* Shoulder taper */}
      <Path d="M14 9 Q13 12 12 16 L38 16 Q37 12 36 9 Z" fill={`url(#${g2})`} />
      {/* Main body - insulated cylinder */}
      <Rect x="11" y="14" width="28" height="33" rx="8" fill={`url(#${g1})`} />
      {/* Bottom cap */}
      <Ellipse cx="25" cy="47" rx="14" ry="4" fill="#075985" />
      {/* Insulated seam rings */}
      <Path
        d="M11 20 Q25 17 39 20"
        stroke="#38bdf8"
        strokeWidth="1.5"
        fill="none"
        opacity="0.45"
        strokeLinecap="round"
      />
      <Path
        d="M11 26 Q25 23 39 26"
        stroke="#38bdf8"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <Path
        d="M11 32 Q25 29 39 32"
        stroke="#38bdf8"
        strokeWidth="1.5"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
      <Path
        d="M11 38 Q25 35 39 38"
        stroke="#38bdf8"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      {/* Body highlight */}
      <Path
        d="M15 16 L15 46"
        stroke="#7dd3fc"
        strokeWidth="4"
        opacity="0.2"
        strokeLinecap="round"
      />
      <Path
        d="M16 18 L16 44"
        stroke="white"
        strokeWidth="1.5"
        opacity="0.12"
        strokeLinecap="round"
      />
      {/* Logo area */}
      <Ellipse cx="28" cy="31" rx="7" ry="5" fill="#0284c7" opacity="0.4" />
      <Path
        d="M24 31 L28 28 L32 31"
        stroke="#7dd3fc"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
    </Svg>
  );
}

export function Skateboard({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 0.3);
  const g1 = `skb1${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 30">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8b5cf6" />
          <Stop offset="1" stopColor="#5b21b6" />
        </LinearGradient>
      </Defs>
      {/* Deck - concave board with kicktails */}
      <Path
        d="M4 12 Q2 4 10 2 L90 2 Q98 4 96 12 Q98 20 90 22 L10 22 Q2 20 4 12 Z"
        fill={`url(#${g1})`}
      />
      {/* Deck graphic - lightning bolt */}
      <Path
        d="M52 6 L42 14 L50 14 L38 22 L52 12 L44 12 Z"
        fill="#c4b5fd"
        opacity="0.7"
      />
      {/* Deck edge detail */}
      <Path d="M10 2 L90 2" stroke="#7c3aed" strokeWidth="0.8" opacity="0.6" />
      <Path
        d="M10 22 L90 22"
        stroke="#7c3aed"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Grip tape texture */}
      <Path
        d="M15 5 L85 5 M15 8 L85 8 M15 11 L85 11 M15 14 L85 14 M15 17 L85 17 M15 20 L85 20"
        stroke="#4c1d95"
        strokeWidth="0.5"
        opacity="0.35"
      />
      <Path
        d="M20 2 L20 22 M30 2 L30 22 M40 2 L40 22 M50 2 L50 22 M60 2 L60 22 M70 2 L70 22 M80 2 L80 22"
        stroke="#4c1d95"
        strokeWidth="0.5"
        opacity="0.25"
      />
      {/* Trucks */}
      <Rect x="14" y="20" width="22" height="6" rx="2" fill="#374151" />
      <Rect x="64" y="20" width="22" height="6" rx="2" fill="#374151" />
      {/* Truck axle */}
      <Path
        d="M14 23 L36 23 M64 23 L86 23"
        stroke="#6b7280"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Wheels */}
      <Circle
        cx="18"
        cy="27"
        r="4"
        fill="#1c1c1e"
        stroke="#374151"
        strokeWidth="1"
      />
      <Circle
        cx="32"
        cy="27"
        r="4"
        fill="#1c1c1e"
        stroke="#374151"
        strokeWidth="1"
      />
      <Circle
        cx="68"
        cy="27"
        r="4"
        fill="#1c1c1e"
        stroke="#374151"
        strokeWidth="1"
      />
      <Circle
        cx="82"
        cy="27"
        r="4"
        fill="#1c1c1e"
        stroke="#374151"
        strokeWidth="1"
      />
      {/* Wheel bearings */}
      <Circle cx="18" cy="27" r="1.5" fill="#6b7280" />
      <Circle cx="32" cy="27" r="1.5" fill="#6b7280" />
      <Circle cx="68" cy="27" r="1.5" fill="#6b7280" />
      <Circle cx="82" cy="27" r="1.5" fill="#6b7280" />
      {/* Deck highlight */}
      <Path
        d="M12 5 Q50 2 88 5"
        stroke="#c4b5fd"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Surfboard({
  size,
  uid: _uid = "d",
}: {
  size: number;
  uid?: string;
}) {
  const h = Math.round(size * 1.5);
  const g1 = `surf1${_uid}`;
  const g2 = `surf2${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 50 75">
      <Defs>
        <LinearGradient id={g1} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#0369a1" />
          <Stop offset="0.4" stopColor="#0ea5e9" />
          <Stop offset="1" stopColor="#0369a1" />
        </LinearGradient>
        <LinearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7dd3fc" />
          <Stop offset="1" stopColor="#0284c7" />
        </LinearGradient>
      </Defs>
      {/* Board shadow/outline */}
      <Path
        d="M25 2 Q42 22 42 52 Q42 68 34 73 L25 76 L16 73 Q8 68 8 52 Q8 22 25 2 Z"
        fill="#075985"
        opacity="0.3"
      />
      {/* Main board body */}
      <Path
        d="M25 2 Q40 20 40 50 Q40 66 32 72 L25 75 L18 72 Q10 66 10 50 Q10 20 25 2 Z"
        fill={`url(#${g1})`}
      />
      {/* Lighter top layer / rail highlight */}
      <Path
        d="M25 2 Q37 20 37 50 Q37 64 30 70 L25 73 L20 70 Q13 64 13 50 Q13 20 25 2 Z"
        fill={`url(#${g2})`}
        opacity="0.55"
      />
      {/* Stringer - center line */}
      <Path
        d="M25 3 L25 72"
        stroke="white"
        strokeWidth="1.5"
        opacity="0.4"
        strokeLinecap="round"
      />
      {/* Rail bands/stripes */}
      <Path
        d="M17 20 Q13 38 14 55"
        stroke="white"
        strokeWidth="3"
        fill="none"
        opacity="0.25"
        strokeLinecap="round"
      />
      <Path
        d="M33 20 Q37 38 36 55"
        stroke="white"
        strokeWidth="3"
        fill="none"
        opacity="0.25"
        strokeLinecap="round"
      />
      {/* Teal accent color stripe */}
      <Path
        d="M21 30 Q15 48 16 62"
        stroke="#2dd4bf"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
        strokeLinecap="round"
      />
      <Path
        d="M29 30 Q35 48 34 62"
        stroke="#2dd4bf"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
        strokeLinecap="round"
      />
      {/* Board nose star/logo */}
      <Path
        d="M25 10 L26.5 14 L30 14 L27.5 16.5 L28.5 20 L25 18 L21.5 20 L22.5 16.5 L20 14 L23.5 14 Z"
        fill="white"
        opacity="0.5"
      />
      {/* Cross deck line */}
      <Path
        d="M17 42 L33 42"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
      {/* Fin (skeg) */}
      <Path
        d="M22 70 L18 82 Q22 80 25 75 Q28 80 32 82 L28 70 Z"
        fill="#0369a1"
      />
      <Path
        d="M23 71 L20 80 Q24 78 25 75 Q26 78 30 80 L27 71 Z"
        fill="#075985"
      />
      {/* Board tip nose */}
      <Path
        d="M22 4 Q25 1 28 4"
        stroke="#7dd3fc"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
    </Svg>
  );
}

// ─── REGISTRY ─────────────────────────────────────────────────────────────────

export type AccessoryItem = {
  id: string;
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: component union
  Component: React.ComponentType<any>;
};

export type AccessoryCategory = {
  label: string;
  slot: keyof AccessorySlots;
  items: AccessoryItem[];
};

export const ACCESSORY_CATEGORIES: AccessoryCategory[] = [
  {
    label: "Hats",
    slot: "hat",
    items: [
      { id: "hat_baseball", name: "Baseball Cap", Component: BaseballCap },
      { id: "hat_cowboy", name: "Cowboy Hat", Component: CowboyHat },
      { id: "hat_beanie", name: "Beanie", Component: Beanie },
      { id: "hat_snapback", name: "Snapback", Component: Snapback },
      { id: "hat_straw", name: "Straw Hat", Component: StrawHat },
      { id: "hat_santa", name: "Santa Hat", Component: SantaHat },
      { id: "hat_animal", name: "Animal Hat", Component: AnimalHat },
      { id: "hat_headphones", name: "Headphones", Component: HeadphonesHat },
    ],
  },
  {
    label: "Glasses",
    slot: "glasses",
    items: [
      { id: "glasses_sunglasses", name: "Sunglasses", Component: Sunglasses },
      { id: "glasses_sport", name: "Sport Shades", Component: SportShades },
      { id: "glasses_round", name: "Round Glasses", Component: RoundGlasses },
      { id: "glasses_heart", name: "Heart Glasses", Component: HeartGlasses },
      { id: "glasses_goggles", name: "Ski Goggles", Component: SkiGoggles },
      {
        id: "glasses_prescription",
        name: "Prescription",
        Component: PrescriptionGlasses,
      },
    ],
  },
  {
    label: "Tops",
    slot: "outfit",
    items: [
      { id: "outfit_tshirt", name: "T-Shirt", Component: TShirt },
      { id: "outfit_hoodie", name: "Hoodie", Component: Hoodie },
      { id: "outfit_sweater", name: "Sweater", Component: Sweater },
      { id: "outfit_jacket", name: "Jacket", Component: Jacket },
      { id: "outfit_flannel", name: "Flannel", Component: Flannel },
      { id: "outfit_dressshirt", name: "Dress Shirt", Component: DressShirt },
      { id: "outfit_tanktop", name: "Tank Top", Component: TankTop },
      {
        id: "outfit_sweatervest",
        name: "Sweater Vest",
        Component: SweaterVest,
      },
      { id: "outfit_necklace", name: "Necklace", Component: Necklace },
    ],
  },
  {
    label: "Pants / Shorts",
    slot: "bottom",
    items: [
      { id: "bottom_jeans", name: "Jeans", Component: Jeans },
      { id: "bottom_cargo", name: "Cargo Pants", Component: CargoPants },
      { id: "bottom_sweatpants", name: "Sweatpants", Component: Sweatpants },
      { id: "bottom_shorts", name: "Shorts", Component: Shorts },
      { id: "bottom_skirt", name: "Skirt", Component: MiniSkirt },
      { id: "bottom_swimtrunks", name: "Swim Trunks", Component: SwimTrunks },
      { id: "bottom_leggings", name: "Leggings", Component: Leggings },
    ],
  },
  {
    label: "Shoes",
    slot: "shoes",
    items: [
      { id: "shoes_sneakers", name: "Sneakers", Component: Sneakers },
      { id: "shoes_boots", name: "Boots", Component: Boots },
      { id: "shoes_slides", name: "Slides", Component: Slides },
      { id: "shoes_sandals", name: "Sandals", Component: Sandals },
      { id: "shoes_hightop", name: "High Tops", Component: HighTops },
      { id: "shoes_snowboots", name: "Snow Boots", Component: SnowBoots },
      { id: "shoes_dress", name: "Dress Shoes", Component: DressShoes },
    ],
  },
  {
    label: "Bags & Extras",
    slot: "bag",
    items: [
      { id: "bag_backpack", name: "Backpack", Component: Backpack },
      { id: "bag_tote", name: "Tote Bag", Component: ToteBag },
      { id: "bag_crossbody", name: "Crossbody", Component: CrossbodyBag },
      { id: "bag_fanny", name: "Fanny Pack", Component: FannyPack },
      { id: "bag_laptop", name: "Laptop Bag", Component: LaptopBag },
      { id: "bag_gym", name: "Gym Bag", Component: GymBag },
      { id: "bag_camera", name: "Camera", Component: CameraAccessory },
      { id: "bag_watch", name: "Watches", Component: Watch },
      { id: "bag_keychain", name: "Keychain", Component: Keychain },
      { id: "bag_waterbottle", name: "Water Bottle", Component: WaterBottle },
      { id: "bag_skateboard", name: "Skateboard", Component: Skateboard },
      { id: "bag_surfboard", name: "Surfboard", Component: Surfboard },
    ],
  },
];

export const ACCESSORY_MAP: Record<string, AccessoryItem["Component"]> = {};
for (const cat of ACCESSORY_CATEGORIES) {
  for (const item of cat.items) {
    ACCESSORY_MAP[item.id] = item.Component;
  }
}

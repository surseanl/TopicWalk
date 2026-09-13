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

export type AccessorySlots = { hat: string; glasses: string; outfit: string };

export function parseAccessory(val: string): AccessorySlots {
  if (!val) return { hat: "", glasses: "", outfit: "" };
  const p = val.split("|");
  if (p.length >= 3)
    return { hat: p[0] ?? "", glasses: p[1] ?? "", outfit: p[2] ?? "" };
  // 2-part legacy: hat|outfit
  return { hat: p[0] ?? "", glasses: "", outfit: p[1] ?? "" };
}

export function encodeAccessory({
  hat,
  glasses,
  outfit,
}: AccessorySlots): string {
  if (!hat && !glasses && !outfit) return "";
  return `${hat}|${glasses}|${outfit}`;
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 68">
      <Path d="M18 58 C15 38 22 16 50 10 C78 16 85 38 82 58 Z" fill="#1c1c1e" />
      <Ellipse cx="50" cy="59" rx="46" ry="11" fill="#111111" />
      <Path d="M20 59 Q50 67 80 59 Q50 64 20 59 Z" fill="#2a2a2e" />
      <Circle cx="50" cy="11" r="4" fill="#3c3c40" />
      <Circle cx="50" cy="11" r="2" fill="#5c5c60" />
      <Path
        d="M37 30 L37 44 L44 30 L44 44"
        stroke="white"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M53 30 L53 44 M53 30 L60 44 L60 30"
        stroke="white"
        strokeWidth="2.2"
        fill="none"
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
  const g = `cg${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 120 72">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a16207" />
          <Stop offset="1" stopColor="#78350f" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="60" cy="56" rx="58" ry="14" fill="#6b3a0d" />
      <Ellipse cx="60" cy="53" rx="55" ry="8" fill="#92400e" />
      <Path
        d="M28 54 C26 34 36 14 60 10 C84 14 94 34 92 54 Z"
        fill={`url(#${g})`}
      />
      <Path
        d="M28 54 C35 42 40 36 60 36 C80 36 85 42 92 54"
        stroke="#78350f"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M30 54 Q60 50 90 54"
        stroke="#451a03"
        strokeWidth="5"
        fill="none"
      />
      <Polygon
        points="60,43 61.8,48.5 67.5,48.5 62.9,51.8 64.7,57.3 60,54 55.3,57.3 57.1,51.8 52.5,48.5 58.2,48.5"
        fill="#fbbf24"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 90 78">
      <Path d="M10 62 C8 35 20 12 45 8 C70 12 82 35 80 62 Z" fill="#1e3a5f" />
      <Rect x="10" y="52" width="70" height="12" rx="4" fill="#172d47" />
      <Rect x="10" y="57" width="70" height="4" rx="2" fill="#1e3a5f" />
      <Path
        d="M15 48 Q45 43 75 48"
        stroke="#2563eb"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M13 40 Q45 34 77 40"
        stroke="#2563eb"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M12 32 Q45 25 78 32"
        stroke="#2563eb"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <Circle cx="45" cy="10" r="12" fill="#3b82f6" />
      <Circle cx="45" cy="10" r="9" fill="#60a5fa" />
      <Circle cx="41" cy="7" r="2" fill="#93c5fd" opacity="0.7" />
      <Circle cx="49" cy="8" r="2" fill="#93c5fd" opacity="0.7" />
      <Circle cx="44" cy="14" r="2" fill="#93c5fd" opacity="0.7" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 85">
      <Path d="M15 65 Q20 30 55 5 Q65 40 85 65 Z" fill="#dc2626" />
      <Path
        d="M12 60 Q30 70 55 70 Q75 70 88 62"
        stroke="#dc2626"
        strokeWidth="2"
        fill="none"
      />
      <Ellipse cx="50" cy="66" rx="36" ry="10" fill="white" />
      <Path
        d="M14 66 Q30 73 50 73 Q70 73 86 66"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Circle cx="55" cy="8" r="11" fill="white" />
      <Circle cx="55" cy="8" r="8" fill="#f1f5f9" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 110 38">
      <Rect x="4" y="4" width="44" height="26" rx="10" fill="#1a1a1a" />
      <Rect
        x="4"
        y="4"
        width="44"
        height="26"
        rx="10"
        stroke="#444"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M12 10 Q18 8 24 11"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.2"
        strokeLinecap="round"
      />
      <Rect x="62" y="4" width="44" height="26" rx="10" fill="#1a1a1a" />
      <Rect
        x="62"
        y="4"
        width="44"
        height="26"
        rx="10"
        stroke="#444"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M70 10 Q76 8 82 11"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.2"
        strokeLinecap="round"
      />
      <Path
        d="M48 17 L62 17"
        stroke="#444"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M4 17 L0 17"
        stroke="#333"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M106 17 L110 17"
        stroke="#333"
        strokeWidth="3"
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
      <Circle
        cx="28"
        cy="22"
        r="20"
        stroke="#d97706"
        strokeWidth="3"
        fill="rgba(217,119,6,0.07)"
      />
      <Circle
        cx="82"
        cy="22"
        r="20"
        stroke="#d97706"
        strokeWidth="3"
        fill="rgba(217,119,6,0.07)"
      />
      <Path
        d="M48 22 L62 22"
        stroke="#d97706"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M8 22 L0 22"
        stroke="#b45309"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M102 22 L110 22"
        stroke="#b45309"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M16 13 Q21 11 26 14"
        stroke="#d97706"
        strokeWidth="1.2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <Path
        d="M70 13 Q75 11 80 14"
        stroke="#d97706"
        strokeWidth="1.2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
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
      <Path
        d="M28 40 C6 28 6 12 21 12 C26 12 28 17 28 17 C28 17 30 12 35 12 C50 12 50 28 28 40 Z"
        fill="#f43f5e"
      />
      <Path
        d="M28 40 C6 28 6 12 21 12 C26 12 28 17 28 17 C28 17 30 12 35 12 C50 12 50 28 28 40 Z"
        stroke="#be123c"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M17 17 Q22 14 26 17"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
      <Path
        d="M82 40 C60 28 60 12 75 12 C80 12 82 17 82 17 C82 17 84 12 89 12 C104 12 104 28 82 40 Z"
        fill="#f43f5e"
      />
      <Path
        d="M82 40 C60 28 60 12 75 12 C80 12 82 17 82 17 C82 17 84 12 89 12 C104 12 104 28 82 40 Z"
        stroke="#be123c"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M71 17 Q76 14 80 17"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
      <Path
        d="M50 26 L60 26"
        stroke="#f43f5e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M6 26 L0 26"
        stroke="#f43f5e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M104 26 L110 26"
        stroke="#f43f5e"
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
  const h = Math.round(size * 0.36);
  const g = `sp${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 120 44">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#3b82f6" />
          <Stop offset="0.33" stopColor="#8b5cf6" />
          <Stop offset="0.66" stopColor="#ec4899" />
          <Stop offset="1" stopColor="#f97316" />
        </LinearGradient>
      </Defs>
      <Path
        d="M8 36 Q60 6 112 36 Q60 24 8 36 Z"
        fill={`url(#${g})`}
        opacity="0.88"
      />
      <Path
        d="M8 36 Q60 6 112 36"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.35"
      />
      <Path
        d="M8 36 Q60 26 112 36"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M8 36 L2 39"
        stroke="#555"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M112 36 L118 39"
        stroke="#555"
        strokeWidth="3"
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
      <Path
        d="M24 14 L4 8 L0 28 L24 26 Z"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />
      <Path
        d="M76 14 L96 8 L100 28 L76 26 Z"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />
      <Rect
        x="20"
        y="14"
        width="60"
        height="58"
        rx="4"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />
      <Path
        d="M38 14 Q50 26 62 14"
        stroke="#e2e8f0"
        strokeWidth="2"
        fill="none"
      />
      <Circle
        cx="50"
        cy="44"
        r="10"
        stroke="#94a3b8"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M44 46 Q50 52 56 46"
        stroke="#94a3b8"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="46.5" cy="42" r="1.5" fill="#94a3b8" />
      <Circle cx="53.5" cy="42" r="1.5" fill="#94a3b8" />
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
          <Stop offset="0" stopColor="#27272a" />
          <Stop offset="1" stopColor="#18181b" />
        </LinearGradient>
      </Defs>
      <Path
        d="M22 22 L2 18 L0 40 L22 38 Z"
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth="1"
      />
      <Path
        d="M78 22 L98 18 L100 40 L78 38 Z"
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth="1"
      />
      <Rect x="18" y="22" width="64" height="60" rx="5" fill={`url(#${g})`} />
      <Path
        d="M30 22 Q50 5 70 22 Q62 14 50 12 Q38 14 30 22 Z"
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth="1"
      />
      <Path d="M38 22 Q50 16 62 22 Q50 20 38 22 Z" fill="#1c1c1e" />
      <Path d="M50 22 L50 82" stroke="#3f3f46" strokeWidth="1" opacity="0.4" />
      <Rect
        x="33"
        y="56"
        width="34"
        height="18"
        rx="4"
        stroke="#3f3f46"
        strokeWidth="1.5"
        fill="#1c1c1e"
      />
      <Path d="M50 56 L50 74" stroke="#3f3f46" strokeWidth="1" opacity="0.4" />
      <Path
        d="M39 40 Q52 35 58 38"
        stroke="#e2e8f0"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
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
      <Path
        d="M10 8 Q50 40 90 8"
        stroke="#fbbf24"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="5,3"
      />
      <Path
        d="M10 8 Q50 40 90 8"
        stroke="#fde68a"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="5,3"
        strokeDashoffset="4"
        opacity="0.6"
      />
      <Polygon
        points="50,34 51.5,39 56.5,39 52.5,42 54,47 50,44 46,47 47.5,42 43.5,39 48.5,39"
        fill="#fbbf24"
      />
      <Polygon
        points="50,35 51.2,39 55.6,39 52.2,41.4 53.4,45.4 50,43 46.6,45.4 47.8,41.4 44.4,39 48.8,39"
        fill="#fde68a"
      />
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
      { id: "hat_bucket", name: "Bucket Hat", Component: BucketHat },
      { id: "hat_frog", name: "Frog Hat", Component: FrogHat },
      { id: "hat_crown", name: "Crown", Component: Crown },
      { id: "hat_santa", name: "Santa Hat", Component: SantaHat },
      { id: "hat_wizard", name: "Wizard Hat", Component: WizardHat },
      { id: "hat_beret", name: "Beret", Component: Beret },
      { id: "hat_bear", name: "Bear Hat", Component: BearHat },
      { id: "hat_catears", name: "Cat Ears", Component: CatEars },
      { id: "hat_trucker", name: "Trucker Hat", Component: TruckerHat },
      { id: "hat_jester", name: "Jester Hat", Component: JesterHat },
      { id: "hat_top", name: "Top Hat", Component: TopHat },
      { id: "hat_party", name: "Party Hat", Component: PartyHat },
    ],
  },
  {
    label: "Glasses",
    slot: "glasses",
    items: [
      { id: "glasses_sunglasses", name: "Sunglasses", Component: Sunglasses },
      { id: "glasses_round", name: "Round Frames", Component: RoundGlasses },
      { id: "glasses_heart", name: "Heart Glasses", Component: HeartGlasses },
      { id: "glasses_sport", name: "Sport Shades", Component: SportShades },
      { id: "glasses_star", name: "Star Glasses", Component: StarGlasses },
      {
        id: "glasses_cateye",
        name: "Cat Eye Frames",
        Component: CatEyeGlasses,
      },
      { id: "glasses_visor", name: "Visor Shield", Component: VisorGlasses },
    ],
  },
  {
    label: "Outfit",
    slot: "outfit",
    items: [
      { id: "outfit_tshirt", name: "T-Shirt", Component: TShirt },
      { id: "outfit_hoodie", name: "Hoodie", Component: Hoodie },
      {
        id: "outfit_varsity",
        name: "Varsity Jacket",
        Component: VarsityJacket,
      },
      { id: "outfit_necklace", name: "Necklace", Component: Necklace },
      { id: "outfit_wings", name: "Wings", Component: Wings },
      { id: "outfit_headphones", name: "Headphones", Component: Headphones },
      { id: "outfit_bowtie", name: "Bow Tie", Component: BowTie },
      { id: "outfit_scarf", name: "Scarf", Component: Scarf },
      { id: "outfit_cape", name: "Cape", Component: Cape },
      { id: "outfit_chain", name: "Gold Chain", Component: GoldChain },
      { id: "outfit_overalls", name: "Overalls", Component: Overalls },
    ],
  },
];

export const ACCESSORY_MAP: Record<string, AccessoryItem["Component"]> = {};
for (const cat of ACCESSORY_CATEGORIES) {
  for (const item of cat.items) {
    ACCESSORY_MAP[item.id] = item.Component;
  }
}

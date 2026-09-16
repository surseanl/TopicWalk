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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 78">
      <Path
        d="M22 22 L2 18 L0 44 L22 42 Z"
        fill="#0891b2"
        stroke="#0e7490"
        strokeWidth="1"
      />
      <Path
        d="M78 22 L98 18 L100 44 L78 42 Z"
        fill="#0891b2"
        stroke="#0e7490"
        strokeWidth="1"
      />
      <Rect x="18" y="20" width="64" height="58" rx="5" fill="#0891b2" />
      <Path d="M36 20 Q36 10 50 8 Q64 10 64 20" fill="#0e7490" />
      <Rect x="22" y="20" width="56" height="8" rx="2" fill="#0e7490" />
      <Path
        d="M18 32 Q50 28 82 32"
        stroke="#0e7490"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6,4"
      />
      <Path
        d="M18 42 Q50 38 82 42"
        stroke="#0e7490"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6,4"
      />
      <Path
        d="M18 52 Q50 48 82 52"
        stroke="#0e7490"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6,4"
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
  const h = Math.round(size * 0.5);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 50">
      <Rect x="5" y="0" width="90" height="12" rx="4" fill="#1e40af" />
      <Rect x="18" y="0" width="6" height="12" rx="2" fill="#1e3a8a" />
      <Rect x="76" y="0" width="6" height="12" rx="2" fill="#1e3a8a" />
      <Path d="M5 10 L10 50 L46 50 L50 10 Z" fill="#1d4ed8" />
      <Path d="M50 10 L54 50 L90 50 L95 10 Z" fill="#1d4ed8" />
      <Path d="M50 10 L50 50" stroke="#1e40af" strokeWidth="2" />
      <Path
        d="M8 12 Q20 24 30 16"
        stroke="#1e3a8a"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M92 12 Q80 24 70 16"
        stroke="#1e3a8a"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M5 10 Q12 14 18 12"
        stroke="#60a5fa"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
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
      <Rect x="5" y="0" width="90" height="10" rx="4" fill="#7c3aed" />
      <Path d="M5 8 L8 38 L46 38 L50 8 Z" fill="#8b5cf6" />
      <Path d="M50 8 L54 38 L92 38 L95 8 Z" fill="#8b5cf6" />
      <Path d="M50 8 L50 38" stroke="#7c3aed" strokeWidth="2" />
      <Path
        d="M36 5 Q50 8 64 5"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M8 36 Q30 32 46 36"
        stroke="#7c3aed"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M54 36 Q70 32 92 36"
        stroke="#7c3aed"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 48">
      <Rect x="20" y="0" width="60" height="10" rx="4" fill="#db2777" />
      <Path d="M20 8 Q0 20 2 48 Q50 56 98 48 Q100 20 80 8 Z" fill="#ec4899" />
      <Path
        d="M2 46 Q50 54 98 46"
        stroke="#db2777"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      <Path
        d="M34 8 Q30 28 28 46"
        stroke="#db2777"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M50 8 L50 48"
        stroke="#db2777"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M66 8 Q70 28 72 46"
        stroke="#db2777"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 50">
      <Rect x="5" y="0" width="90" height="12" rx="4" fill="#4b5320" />
      <Path d="M5 10 L10 50 L46 50 L50 10 Z" fill="#6b7a2a" />
      <Path d="M50 10 L54 50 L90 50 L95 10 Z" fill="#6b7a2a" />
      <Path d="M50 10 L50 50" stroke="#4b5320" strokeWidth="2" />
      <Rect x="12" y="20" width="22" height="18" rx="3" fill="#4b5320" />
      <Rect x="14" y="22" width="18" height="14" rx="2" fill="#5a6828" />
      <Rect x="66" y="20" width="22" height="18" rx="3" fill="#4b5320" />
      <Rect x="68" y="22" width="18" height="14" rx="2" fill="#5a6828" />
      <Path
        d="M12 25 Q23 27 34 25"
        stroke="#4b5320"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M66 25 Q77 27 88 25"
        stroke="#4b5320"
        strokeWidth="1.5"
        fill="none"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 50">
      <Rect x="5" y="0" width="90" height="10" rx="4" fill="#111827" />
      <Path d="M5 8 L8 50 L48 50 L50 8 Z" fill="#1f2937" />
      <Path d="M50 8 L52 50 L92 50 L95 8 Z" fill="#1f2937" />
      <Path d="M50 8 L50 50" stroke="#374151" strokeWidth="2" />
      <Path
        d="M20 8 Q16 28 14 50"
        stroke="#374151"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <Path
        d="M80 8 Q84 28 86 50"
        stroke="#374151"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 52">
      <Rect x="5" y="0" width="90" height="12" rx="5" fill="#374151" />
      <Path
        d="M36 6 Q50 9 64 6"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="36" cy="6" r="2.5" fill="#6b7280" />
      <Circle cx="64" cy="6" r="2.5" fill="#6b7280" />
      <Path d="M5 10 L8 52 L46 52 L50 10 Z" fill="#4b5563" />
      <Path d="M50 10 L54 52 L92 52 L95 10 Z" fill="#4b5563" />
      <Rect x="8" y="46" width="38" height="6" rx="3" fill="#374151" />
      <Rect x="54" y="46" width="38" height="6" rx="3" fill="#374151" />
      <Path d="M50 10 L50 50" stroke="#374151" strokeWidth="2" />
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
  const h = Math.round(size * 0.38);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 38">
      <Rect x="0" y="14" width="44" height="18" rx="9" fill="#f5f5f5" />
      <Rect x="0" y="24" width="44" height="8" rx="4" fill="#dc2626" />
      <Path d="M8 14 Q10 8 16 6 L28 6 Q34 8 36 14 Z" fill="#f5f5f5" />
      <Path
        d="M10 10 Q20 8 30 10"
        stroke="#d1d5db"
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M12 17 L32 17 M12 21 L32 21"
        stroke="#9ca3af"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="56" y="14" width="44" height="18" rx="9" fill="#f5f5f5" />
      <Rect x="56" y="24" width="44" height="8" rx="4" fill="#dc2626" />
      <Path d="M64 14 Q66 8 72 6 L84 6 Q90 8 92 14 Z" fill="#f5f5f5" />
      <Path
        d="M66 10 Q76 8 86 10"
        stroke="#d1d5db"
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M68 17 L88 17 M68 21 L88 21"
        stroke="#9ca3af"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
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
  const h = Math.round(size * 0.46);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 46">
      <Path d="M6 0 L6 30 Q6 38 14 38 Q22 38 26 30 L28 0 Z" fill="#3b1f0a" />
      <Rect x="0" y="30" width="32" height="10" rx="5" fill="#2a1505" />
      <Path d="M28 30 Q34 38 32 46 L0 46 Q2 40 0 32" fill="#2a1505" />
      <Path
        d="M8 8 L26 8 M8 14 L26 14 M8 20 L26 20 M8 26 L26 26"
        stroke="#6b3a1a"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M72 0 L72 30 Q72 38 80 38 Q88 38 94 30 L94 0 Z" fill="#3b1f0a" />
      <Rect x="68" y="30" width="32" height="10" rx="5" fill="#2a1505" />
      <Path d="M94 30 Q100 38 98 46 L66 46 Q68 40 68 32" fill="#2a1505" />
      <Path
        d="M74 8 L92 8 M74 14 L92 14 M74 20 L92 20 M74 26 L92 26"
        stroke="#6b3a1a"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
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
  const h = Math.round(size * 0.48);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 48">
      <Rect x="2" y="8" width="40" height="32" rx="4" fill="#1c1c1e" />
      <Rect x="2" y="34" width="40" height="10" rx="5" fill="#111" />
      <Path d="M28 34 Q42 40 42 48 L2 48 Q0 42 2 34" fill="#111" />
      <Circle cx="22" cy="24" r="6" fill="#f5f5f5" opacity="0.8" />
      <Polygon
        points="22,19 23,22 26.5,22 23.8,24 24.8,27.5 22,25.5 19.2,27.5 20.2,24 17.5,22 21,22"
        fill="#1c1c1e"
      />
      <Path
        d="M6 14 L14 14 M6 18 L14 18 M6 22 L14 22 M6 26 L14 26 M6 30 L14 30"
        stroke="#e5e7eb"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="58" y="8" width="40" height="32" rx="4" fill="#1c1c1e" />
      <Rect x="58" y="34" width="40" height="10" rx="5" fill="#111" />
      <Path d="M84 34 Q98 40 98 48 L58 48 Q56 42 58 34" fill="#111" />
      <Circle cx="78" cy="24" r="6" fill="#f5f5f5" opacity="0.8" />
      <Polygon
        points="78,19 79,22 82.5,22 79.8,24 80.8,27.5 78,25.5 75.2,27.5 76.2,24 73.5,22 77,22"
        fill="#1c1c1e"
      />
      <Path
        d="M62 14 L70 14 M62 18 L70 18 M62 22 L70 22 M62 26 L70 26 M62 30 L70 30"
        stroke="#e5e7eb"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
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
  const h = Math.round(size * 0.28);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 28">
      <Rect x="0" y="18" width="42" height="10" rx="5" fill="#0ea5e9" />
      <Path d="M4 16 Q21 6 38 16 Q30 10 21 10 Q12 10 4 16 Z" fill="#0ea5e9" />
      <Path
        d="M4 16 Q21 10 38 16"
        stroke="#0284c7"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="58" y="18" width="42" height="10" rx="5" fill="#0ea5e9" />
      <Path d="M62 16 Q79 6 96 16 Q88 10 79 10 Q70 10 62 16 Z" fill="#0ea5e9" />
      <Path
        d="M62 16 Q79 10 96 16"
        stroke="#0284c7"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 92">
      <Rect x="28" y="2" width="16" height="24" rx="8" fill="#0284c7" />
      <Rect x="56" y="2" width="16" height="24" rx="8" fill="#0284c7" />
      <Rect x="10" y="14" width="80" height="74" rx="16" fill="#0ea5e9" />
      <Rect x="20" y="52" width="60" height="28" rx="10" fill="#0284c7" />
      <Path
        d="M30 52 Q50 48 70 52"
        stroke="#bae6fd"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="50" r="3" fill="#7dd3fc" />
      <Path
        d="M18 26 Q50 20 82 26"
        stroke="#bae6fd"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="24" r="4" fill="#7dd3fc" />
      <Rect x="40" y="8" width="20" height="8" rx="4" fill="#0284c7" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 82">
      <Path
        d="M28 14 Q24 0 32 0 Q40 0 36 14"
        stroke="#d97706"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M64 14 Q60 0 68 0 Q76 0 72 14"
        stroke="#d97706"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M10 14 Q8 82 10 82 L90 82 Q92 82 90 14 Z" fill="#fbbf24" />
      <Rect x="8" y="10" width="84" height="10" rx="2" fill="#f59e0b" />
      <Circle cx="50" cy="52" r="18" fill="#f59e0b" opacity="0.6" />
      <Path
        d="M42 50 L48 56 L62 42"
        stroke="#d97706"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 65">
      <Path
        d="M12 10 Q8 0 20 0 L80 0 Q92 0 88 10"
        stroke="#7c3aed"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="12" y="10" width="76" height="48" rx="12" fill="#8b5cf6" />
      <Path d="M12 10 Q12 34 50 36 Q88 34 88 10 Z" fill="#7c3aed" />
      <Circle cx="50" cy="35" r="6" fill="#fbbf24" />
      <Circle cx="50" cy="35" r="3.5" fill="#f59e0b" />
      <Rect
        x="16"
        y="14"
        width="68"
        height="40"
        rx="9"
        fill="none"
        stroke="#9d74f0"
        strokeWidth="1.5"
        strokeDasharray="4,3"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 42">
      <Rect x="0" y="12" width="100" height="10" rx="5" fill="#dc2626" />
      <Rect x="22" y="4" width="56" height="36" rx="12" fill="#ef4444" />
      <Path
        d="M30 18 Q50 14 70 18"
        stroke="#fca5a5"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="16" r="4" fill="#dc2626" />
      <Rect x="2" y="11" width="14" height="12" rx="4" fill="#b91c1c" />
      <Rect x="84" y="11" width="14" height="12" rx="4" fill="#b91c1c" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 65">
      <Path d="M18 52 C16 32 22 14 50 10 C78 14 84 32 82 52 Z" fill="#1c1c1e" />
      <Ellipse cx="50" cy="53" rx="46" ry="10" fill="#111" />
      <Path d="M20 52 Q50 60 80 52 Q50 57 20 52 Z" fill="#2a2a2e" />
      <Path d="M18 52 Q50 56 82 52" stroke="#111" strokeWidth="4" fill="none" />
      <Rect x="28" y="16" width="44" height="34" rx="2" fill="#2a2a2e" />
      <Rect x="46" y="20" width="8" height="24" rx="1" fill="#dc2626" />
      <Rect x="28" y="32" width="44" height="8" rx="1" fill="#dc2626" />
      <Circle cx="50" cy="11" r="4" fill="#3c3c40" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 120 70">
      <Ellipse cx="60" cy="58" rx="58" ry="12" fill="#b45309" />
      <Ellipse cx="60" cy="55" rx="54" ry="8" fill="#d97706" />
      <Path d="M28 52 C26 30 34 10 60 6 C86 10 94 30 92 52 Z" fill="#f59e0b" />
      <Path
        d="M30 40 Q40 37 50 40 Q60 37 70 40 Q80 37 90 40"
        stroke="#d97706"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M30 30 Q40 27 50 30 Q60 27 70 30 Q80 27 90 30"
        stroke="#d97706"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M32 20 Q42 17 52 20 Q62 17 72 20 Q82 17 88 20"
        stroke="#d97706"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <Rect x="24" y="44" width="72" height="10" rx="3" fill="#92400e" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 92">
      <Path d="M28 58 L24 12 Q30 2 36 12 L38 58 Z" fill="#fce7f3" />
      <Path d="M30 56 L27 16 Q30 10 33 16 L35 56 Z" fill="#f9a8d4" />
      <Path d="M62 58 L64 12 Q70 2 76 12 L72 58 Z" fill="#fce7f3" />
      <Path d="M65 56 L67 16 Q70 10 73 16 L70 56 Z" fill="#f9a8d4" />
      <Path d="M14 70 C12 46 18 28 50 22 C82 28 88 46 86 70 Z" fill="#fce7f3" />
      <Rect x="10" y="66" width="80" height="18" rx="8" fill="#f9a8d4" />
      <Circle cx="50" cy="24" r="5" fill="white" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 62">
      <Path
        d="M14 50 Q14 16 50 10 Q86 16 86 50"
        stroke="#18181b"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="14" cy="50" r="14" fill="#27272a" />
      <Circle cx="14" cy="50" r="10" fill="#3f3f46" />
      <Circle cx="14" cy="50" r="6" fill="#27272a" />
      <Circle cx="86" cy="50" r="14" fill="#27272a" />
      <Circle cx="86" cy="50" r="10" fill="#3f3f46" />
      <Circle cx="86" cy="50" r="6" fill="#27272a" />
      <Circle cx="20" cy="56" r="2" fill="#22c55e" />
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
  const h = Math.round(size * 0.42);
  const g = `sg${_uid}`;
  return (
    <Svg width={size} height={h} viewBox="0 0 110 46">
      <Defs>
        <LinearGradient id={g} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#7c3aed" />
          <Stop offset="0.5" stopColor="#2563eb" />
          <Stop offset="1" stopColor="#0891b2" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="14" width="8" height="18" rx="4" fill="#333" />
      <Rect x="102" y="14" width="8" height="18" rx="4" fill="#333" />
      <Path
        d="M8 23 Q18 6 55 6 Q92 6 102 23 Q92 40 55 40 Q18 40 8 23 Z"
        fill="#1a1a1a"
      />
      <Path
        d="M12 23 Q20 10 55 10 Q90 10 98 23 Q90 36 55 36 Q20 36 12 23 Z"
        fill={`url(#${g})`}
        opacity="0.9"
      />
      <Path
        d="M18 16 Q40 12 55 14"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />
      <Rect
        x="50"
        y="18"
        width="10"
        height="10"
        rx="3"
        fill="#111"
        opacity="0.5"
      />
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
      <Rect
        x="4"
        y="6"
        width="44"
        height="22"
        rx="5"
        stroke="#555"
        strokeWidth="2.5"
        fill="rgba(180,220,255,0.12)"
      />
      <Rect
        x="62"
        y="6"
        width="44"
        height="22"
        rx="5"
        stroke="#555"
        strokeWidth="2.5"
        fill="rgba(180,220,255,0.12)"
      />
      <Path
        d="M48 17 L62 17"
        stroke="#555"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M4 17 L0 17"
        stroke="#444"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M106 17 L110 17"
        stroke="#444"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 75">
      <Path
        d="M22 18 L2 14 L0 44 L22 42 Z"
        fill="#1e293b"
        stroke="#334155"
        strokeWidth="1"
      />
      <Path
        d="M78 18 L98 14 L100 44 L78 42 Z"
        fill="#1e293b"
        stroke="#334155"
        strokeWidth="1"
      />
      <Rect x="20" y="16" width="60" height="59" rx="4" fill="#334155" />
      <Path d="M36 16 L44 28 L50 16" fill="#1e293b" />
      <Path d="M64 16 L56 28 L50 16" fill="#1e293b" />
      <Path d="M50 16 L50 75" stroke="#475569" strokeWidth="2.5" />
      <Circle cx="50" cy="22" r="3" fill="#64748b" />
      <Circle cx="50" cy="34" r="3" fill="#64748b" />
      <Circle cx="50" cy="46" r="3" fill="#64748b" />
      <Rect x="20" y="44" width="24" height="16" rx="3" fill="#1e293b" />
      <Rect x="56" y="44" width="24" height="16" rx="3" fill="#1e293b" />
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
      <Path
        d="M24 14 L4 8 L0 30 L24 28 Z"
        fill="#991b1b"
        stroke="#7f1d1d"
        strokeWidth="1"
      />
      <Path
        d="M76 14 L96 8 L100 30 L76 28 Z"
        fill="#991b1b"
        stroke="#7f1d1d"
        strokeWidth="1"
      />
      <Rect x="20" y="14" width="60" height="58" rx="4" fill="#dc2626" />
      <Path
        d="M20 25 Q50 21 80 25 M20 35 Q50 31 80 35 M20 45 Q50 41 80 45 M20 55 Q50 51 80 55 M20 65 Q50 61 80 65"
        stroke="#991b1b"
        strokeWidth="4"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M35 14 L35 72 M50 14 L50 72 M65 14 L65 72"
        stroke="#7f1d1d"
        strokeWidth="3"
        fill="none"
        opacity="0.4"
      />
      <Path
        d="M38 14 Q50 26 62 14"
        stroke="#7f1d1d"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M50 14 L50 72"
        stroke="#b91c1c"
        strokeWidth="1.5"
        opacity="0.4"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 72">
      <Path
        d="M24 14 L4 8 L0 28 L24 26 Z"
        fill="#e2e8f0"
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />
      <Path
        d="M76 14 L96 8 L100 28 L76 26 Z"
        fill="#e2e8f0"
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />
      <Rect
        x="20"
        y="14"
        width="60"
        height="58"
        rx="4"
        fill="#f1f5f9"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />
      <Path d="M50 14 L50 72" stroke="#cbd5e1" strokeWidth="2" />
      <Path d="M36 14 L44 22 L50 14" fill="#e2e8f0" />
      <Path d="M64 14 L56 22 L50 14" fill="#e2e8f0" />
      <Circle cx="50" cy="26" r="2.5" fill="#cbd5e1" />
      <Circle cx="50" cy="36" r="2.5" fill="#cbd5e1" />
      <Circle cx="50" cy="46" r="2.5" fill="#cbd5e1" />
      <Circle cx="50" cy="56" r="2.5" fill="#cbd5e1" />
      <Rect x="58" y="22" width="16" height="14" rx="3" fill="#e2e8f0" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 68">
      <Path d="M36 6 Q50 2 64 6 L68 16 L32 16 Z" fill="#f97316" />
      <Rect x="28" y="14" width="44" height="54" rx="4" fill="#fb923c" />
      <Path d="M28 14 L22 8 Q18 4 26 6 L32 16 Z" fill="#f97316" />
      <Path d="M72 14 L78 8 Q82 4 74 6 L68 16 Z" fill="#f97316" />
      <Path
        d="M38 14 Q50 22 62 14"
        stroke="#ea580c"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M38 38 Q50 35 62 38 M38 50 Q50 47 62 50"
        stroke="#ea580c"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 72">
      <Path
        d="M28 14 L22 72 L78 72 L72 14 L58 14 L50 30 L42 14 Z"
        fill="#1d4ed8"
      />
      <Path
        d="M28 14 L22 72 L78 72 L72 14"
        fill="none"
        stroke="#1e3a8a"
        strokeWidth="1.5"
      />
      <Path d="M28 14 L42 14 L50 30 L58 14 L72 14" fill="#1e3a8a" />
      <Path
        d="M22 28 Q50 24 78 28 M22 40 Q50 36 78 40 M22 52 Q50 48 78 52 M22 64 Q50 60 78 64"
        stroke="#1e3a8a"
        strokeWidth="3"
        fill="none"
        strokeDasharray="8,4"
      />
      <Rect x="22" y="68" width="56" height="4" rx="2" fill="#1e3a8a" />
      <Rect x="22" y="10" width="56" height="4" rx="2" fill="#1e3a8a" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 42">
      <Rect x="5" y="0" width="90" height="10" rx="5" fill="#0369a1" />
      <Path
        d="M36 4 Q50 8 64 4"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M5 8 L8 42 L46 42 L50 8 Z" fill="#0ea5e9" />
      <Path d="M50 8 L54 42 L92 42 L95 8 Z" fill="#0ea5e9" />
      <Path
        d="M8 20 Q22 16 36 20 M8 30 Q22 26 36 30"
        stroke="#38bdf8"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M64 20 Q78 16 92 20 M64 30 Q78 26 92 30"
        stroke="#38bdf8"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <Path d="M50 8 L50 42" stroke="#0369a1" strokeWidth="2" />
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
  const h = Math.round(size * 0.3);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 30">
      <Ellipse cx="21" cy="24" rx="21" ry="6" fill="#a16207" />
      <Path
        d="M4 20 Q10 12 20 14 Q30 12 36 20"
        stroke="#d97706"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M14 20 L14 10 Q21 6 28 10 L28 20"
        stroke="#d97706"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="79" cy="24" rx="21" ry="6" fill="#a16207" />
      <Path
        d="M62 20 Q68 12 78 14 Q88 12 94 20"
        stroke="#d97706"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M72 20 L72 10 Q79 6 86 10 L86 20"
        stroke="#d97706"
        strokeWidth="3"
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
  const h = Math.round(size * 0.46);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 46">
      <Path d="M6 0 L6 28 Q6 36 14 36 Q22 36 26 28 L28 0 Z" fill="#7c3aed" />
      <Rect x="0" y="28" width="32" height="12" rx="6" fill="#6d28d9" />
      <Path d="M28 28 Q34 36 32 46 L0 46 Q2 38 0 30" fill="#6d28d9" />
      <Path
        d="M10 8 L24 8 M10 14 L24 14 M10 20 L24 20"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="16" cy="2" rx="4" ry="2" fill="#ede9fe" />
      <Path d="M72 0 L72 28 Q72 36 80 36 Q88 36 94 28 L94 0 Z" fill="#7c3aed" />
      <Rect x="68" y="28" width="32" height="12" rx="6" fill="#6d28d9" />
      <Path d="M94 28 Q100 36 98 46 L66 46 Q68 38 68 30" fill="#6d28d9" />
      <Path
        d="M76 8 L90 8 M76 14 L90 14 M76 20 L90 20"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="84" cy="2" rx="4" ry="2" fill="#ede9fe" />
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
  const h = Math.round(size * 0.3);
  return (
    <Svg width={size} height={h} viewBox="0 0 100 30">
      <Path
        d="M2 14 Q4 6 18 4 Q34 2 40 14 L40 22 Q40 28 28 28 Q10 28 2 22 Z"
        fill="#1c1c1e"
      />
      <Path d="M40 20 Q44 28 40 30 L30 30 Q32 24 40 20 Z" fill="#111" />
      <Path
        d="M4 18 Q20 14 38 18"
        stroke="#3f3f46"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M60 14 Q62 6 76 4 Q92 2 98 14 L98 22 Q98 28 86 28 Q68 28 60 22 Z"
        fill="#1c1c1e"
      />
      <Path d="M98 20 Q102 28 98 30 L88 30 Q90 24 98 20 Z" fill="#111" />
      <Path
        d="M62 18 Q78 14 96 18"
        stroke="#3f3f46"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 88">
      <Path
        d="M30 6 Q26 0 34 0 Q42 0 38 6"
        stroke="#475569"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="8" y="6" width="84" height="70" rx="10" fill="#334155" />
      <Rect x="14" y="12" width="72" height="58" rx="7" fill="#1e293b" />
      <Rect x="18" y="16" width="64" height="48" rx="5" fill="#0f172a" />
      <Rect x="22" y="20" width="56" height="40" rx="3" fill="#1e293b" />
      <Rect x="28" y="72" width="44" height="10" rx="5" fill="#475569" />
      <Circle cx="50" cy="77" r="3" fill="#64748b" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 65">
      <Ellipse cx="50" cy="48" rx="46" ry="16" fill="#b91c1c" />
      <Rect x="4" y="20" width="92" height="28" rx="14" fill="#dc2626" />
      <Ellipse cx="50" cy="20" rx="46" ry="16" fill="#ef4444" />
      <Path d="M30 4 Q50 0 70 4 L70 20 Q50 16 30 20 Z" fill="#b91c1c" />
      <Path
        d="M30 4 Q50 0 70 4"
        stroke="#fca5a5"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Rect x="42" y="0" width="16" height="8" rx="4" fill="#991b1b" />
      <Path
        d="M10 30 Q50 26 90 30 M10 42 Q50 38 90 42"
        stroke="#fca5a5"
        strokeWidth="2"
        fill="none"
        opacity="0.35"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 88">
      <Path
        d="M20 6 Q24 0 50 0 Q76 0 80 6"
        stroke="#6b7280"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="8" y="22" width="84" height="62" rx="10" fill="#374151" />
      <Rect x="8" y="22" width="84" height="12" rx="6" fill="#4b5563" />
      <Circle cx="50" cy="62" r="22" fill="#1f2937" />
      <Circle cx="50" cy="62" r="17" fill="#111827" />
      <Circle cx="50" cy="62" r="12" fill="#1f2937" />
      <Circle cx="50" cy="62" r="7" fill="#374151" />
      <Circle cx="44" cy="56" r="2.5" fill="#6b7280" opacity="0.4" />
      <Rect x="16" y="26" width="12" height="8" rx="3" fill="#6b7280" />
      <Rect x="72" y="26" width="12" height="8" rx="3" fill="#6b7280" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 60 49">
      <Rect x="18" y="0" width="24" height="12" rx="4" fill="#374151" />
      <Rect x="18" y="37" width="24" height="12" rx="4" fill="#374151" />
      <Rect x="8" y="10" width="44" height="29" rx="10" fill="#1f2937" />
      <Circle
        cx="30"
        cy="24.5"
        r="12"
        fill="#111827"
        stroke="#374151"
        strokeWidth="1.5"
      />
      <Path
        d="M30 16 L30 24.5 L36 24.5"
        stroke="#f9fafb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="30" cy="24.5" r="1.5" fill="#9ca3af" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 50 44">
      <Circle
        cx="25"
        cy="10"
        r="9"
        stroke="#d97706"
        strokeWidth="3"
        fill="none"
      />
      <Circle
        cx="25"
        cy="10"
        r="5"
        stroke="#d97706"
        strokeWidth="2"
        fill="none"
      />
      <Rect x="22" y="18" width="6" height="3" rx="1" fill="#9ca3af" />
      <Rect x="18" y="20" width="4" height="14" rx="2" fill="#6b7280" />
      <Rect x="24" y="21" width="4" height="12" rx="2" fill="#9ca3af" />
      <Rect x="29" y="22" width="4" height="10" rx="2" fill="#6b7280" />
      <Rect x="18" y="32" width="15" height="3" rx="1.5" fill="#374151" />
      <Circle cx="25.5" cy="39" r="4" fill="#fbbf24" />
      <Circle cx="25.5" cy="39" r="2" fill="#f59e0b" />
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
  return (
    <Svg width={size} height={h} viewBox="0 0 50 49">
      <Rect x="17" y="0" width="16" height="8" rx="4" fill="#0369a1" />
      <Path d="M14 8 L12 48 Q12 49 25 49 Q38 49 38 48 L36 8 Z" fill="#0ea5e9" />
      <Path d="M14 8 L36 8" stroke="#0284c7" strokeWidth="2" />
      <Path
        d="M14 20 Q25 17 36 20 M14 32 Q25 29 36 32"
        stroke="#38bdf8"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M16 44 Q25 41 34 44"
        stroke="#7dd3fc"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 100 30">
      <Path
        d="M6 14 Q4 6 10 4 L90 4 Q96 6 94 14 Q96 22 90 24 L10 24 Q4 22 6 14 Z"
        fill="#7c3aed"
      />
      <Path d="M10 4 L90 4" stroke="#6d28d9" strokeWidth="1" />
      <Rect x="15" y="22" width="20" height="5" rx="2" fill="#374151" />
      <Rect x="65" y="22" width="20" height="5" rx="2" fill="#374151" />
      <Circle cx="20" cy="29" r="3" fill="#1c1c1e" />
      <Circle cx="30" cy="29" r="3" fill="#1c1c1e" />
      <Circle cx="70" cy="29" r="3" fill="#1c1c1e" />
      <Circle cx="80" cy="29" r="3" fill="#1c1c1e" />
      <Path
        d="M25 10 L40 10 M40 10 L35 6 M40 10 L35 14"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
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
  return (
    <Svg width={size} height={h} viewBox="0 0 50 75">
      <Path
        d="M25 2 Q40 20 40 50 Q40 66 32 72 L25 75 L18 72 Q10 66 10 50 Q10 20 25 2 Z"
        fill="#0ea5e9"
      />
      <Path
        d="M25 2 Q38 20 38 50 Q38 64 30 70 L25 73 L20 70 Q12 64 12 50 Q12 20 25 2 Z"
        fill="#38bdf8"
      />
      <Path
        d="M25 20 L25 60 M18 35 L32 35"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <Path d="M18 68 L25 75 L32 68 Q25 72 18 68 Z" fill="#0284c7" />
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

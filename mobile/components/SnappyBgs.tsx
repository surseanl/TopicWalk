import type { ReactNode } from "react";
import { Fragment } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";

export type BgDef = {
  id: string;
  label: string;
  render: (size: number) => ReactNode;
};

export const SNAPPY_BACKGROUNDS: BgDef[] = [
  {
    id: "sky",
    label: "Blue Sky",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#5babf0" />
            <Stop offset="1" stopColor="#aad4f5" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#skyG)" />
        <Ellipse cx="22" cy="28" rx="16" ry="7" fill="white" opacity="0.9" />
        <Ellipse cx="34" cy="23" rx="12" ry="8" fill="white" opacity="0.9" />
        <Ellipse cx="45" cy="28" rx="9" ry="5" fill="white" opacity="0.85" />
        <Ellipse cx="68" cy="18" rx="18" ry="8" fill="white" opacity="0.9" />
        <Ellipse cx="80" cy="22" rx="11" ry="7" fill="white" opacity="0.85" />
        <Ellipse cx="14" cy="52" rx="11" ry="5" fill="white" opacity="0.55" />
        <Ellipse cx="24" cy="49" rx="9" ry="6" fill="white" opacity="0.55" />
        <Ellipse cx="58" cy="60" rx="14" ry="5" fill="white" opacity="0.45" />
        <Ellipse cx="68" cy="57" rx="10" ry="6" fill="white" opacity="0.45" />
      </Svg>
    ),
  },
  {
    id: "sunset",
    label: "Sunset",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="sunsetG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1a1a3e" />
            <Stop offset="0.4" stopColor="#6b21a8" />
            <Stop offset="0.65" stopColor="#ea580c" />
            <Stop offset="0.85" stopColor="#fbbf24" />
            <Stop offset="1" stopColor="#fde68a" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#sunsetG)" />
        <Circle cx="50" cy="72" r="10" fill="#fef08a" opacity="0.9" />
        <Path
          d="M0 80 L18 52 L36 70 L52 38 L70 62 L85 45 L100 65 L100 100 L0 100 Z"
          fill="#111827"
        />
      </Svg>
    ),
  },
  {
    id: "night",
    label: "Night Sky",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="nightG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#020617" />
            <Stop offset="1" stopColor="#0f172a" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#nightG)" />
        {(
          [
            [15, 12],
            [30, 8],
            [50, 15],
            [70, 10],
            [85, 18],
            [8, 35],
            [42, 28],
            [78, 30],
            [20, 55],
            [60, 50],
            [90, 45],
            [35, 70],
            [75, 72],
            [55, 85],
            [10, 80],
          ] as [number, number][]
        ).map(([x, y], i) => (
          <Circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={i % 5 === 0 ? 1.4 : 0.8}
            fill="white"
            opacity={0.6 + (i % 4) * 0.1}
          />
        ))}
        <Circle cx="68" cy="25" r="12" fill="#fef9c3" opacity="0.95" />
        <Circle cx="74" cy="22" r="11" fill="#0f172a" />
      </Svg>
    ),
  },
  {
    id: "water",
    label: "Ocean Water",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="waterG" x1="0.2" y1="0" x2="0.8" y2="1">
            <Stop offset="0" stopColor="#22d3ee" />
            <Stop offset="0.5" stopColor="#06b6d4" />
            <Stop offset="1" stopColor="#0e7490" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#waterG)" />
        {([8, 18, 28, 38, 48, 58, 68, 78, 88, 95] as number[]).map((y, i) => (
          <Path
            key={y}
            d={`M0 ${y} Q12 ${y - 3} 25 ${y} Q38 ${y + 3} 50 ${y} Q62 ${y - 3} 75 ${y} Q88 ${y + 3} 100 ${y}`}
            stroke="white"
            strokeWidth={i % 3 === 0 ? 0.8 : 0.4}
            fill="none"
            opacity={0.2 + (i % 3) * 0.1}
          />
        ))}
      </Svg>
    ),
  },
  {
    id: "mountain-outline",
    label: "Mountain Line",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Rect x="0" y="0" width="100" height="100" fill="#1a3a2a" />
        <Path
          d="M-5 85 L25 32 L55 85"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          opacity="0.9"
        />
        <Path
          d="M30 85 L60 22 L88 85"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          opacity="0.9"
        />
        <Path
          d="M55 85 L75 48 L95 85"
          stroke="white"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />
      </Svg>
    ),
  },
  {
    id: "daisies",
    label: "Daisies",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Rect x="0" y="0" width="100" height="100" fill="#c4b5fd" />
        {(
          [
            [18, 18],
            [58, 12],
            [82, 38],
            [12, 65],
            [48, 52],
            [80, 72],
            [32, 85],
            [68, 88],
          ] as [number, number][]
        ).map(([cx, cy]) => (
          <Fragment key={`${cx}-${cy}`}>
            {([0, 45, 90, 135, 180, 225, 270, 315] as number[]).map((a) => {
              const rad = (a * Math.PI) / 180;
              const px = cx + Math.cos(rad) * 7;
              const py = cy + Math.sin(rad) * 7;
              return (
                <Ellipse
                  key={a}
                  cx={px}
                  cy={py}
                  rx="3.5"
                  ry="2"
                  fill="white"
                  opacity="0.92"
                  transform={`rotate(${a} ${px} ${py})`}
                />
              );
            })}
            <Circle cx={cx} cy={cy} r="3.5" fill="#fbbf24" />
          </Fragment>
        ))}
      </Svg>
    ),
  },
  {
    id: "beach",
    label: "Beach",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="beachSkyG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7dd3fc" />
            <Stop offset="0.5" stopColor="#bae6fd" />
          </LinearGradient>
          <LinearGradient id="beachSandG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fde68a" />
            <Stop offset="1" stopColor="#fcd34d" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#beachSkyG)" />
        <Path
          d="M0 55 Q25 50 50 55 Q75 60 100 52 L100 72 Q75 66 50 72 Q25 78 0 72 Z"
          fill="#5eead4"
          opacity="0.85"
        />
        <Path
          d="M0 68 Q25 63 50 68 Q75 73 100 65 L100 100 L0 100 Z"
          fill="url(#beachSandG)"
        />
      </Svg>
    ),
  },
  {
    id: "marble",
    label: "Marble",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Rect x="0" y="0" width="100" height="100" fill="#f5f5f5" />
        <Path
          d="M0 18 Q22 14 38 22 Q54 30 62 26 Q78 18 100 28"
          stroke="#c0c0c0"
          strokeWidth="2"
          fill="none"
          opacity="0.55"
        />
        <Path
          d="M8 42 Q30 36 52 44 Q72 52 92 44"
          stroke="#d0d0d0"
          strokeWidth="1.5"
          fill="none"
          opacity="0.45"
        />
        <Path
          d="M0 62 Q24 55 42 64 Q62 74 84 66 Q92 62 100 67"
          stroke="#aaa"
          strokeWidth="2.5"
          fill="none"
          opacity="0.4"
        />
        <Path
          d="M0 82 Q22 76 46 84 Q66 90 100 83"
          stroke="#bbb"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
        <Path
          d="M28 5 Q33 28 26 52 Q20 72 28 95"
          stroke="#ccc"
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />
        <Path
          d="M72 0 Q77 26 70 52 Q64 78 74 100"
          stroke="#bbb"
          strokeWidth="1"
          fill="none"
          opacity="0.25"
        />
      </Svg>
    ),
  },
  {
    id: "forest",
    label: "Forest",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="forestSkyG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7eb9e8" />
            <Stop offset="0.55" stopColor="#9ec8ef" />
            <Stop offset="0.55" stopColor="#c8d8e0" />
            <Stop offset="1" stopColor="#aec0cc" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#forestSkyG)" />
        {([5, 18, 30, 42, 55, 67, 80, 92] as number[]).map((x) => (
          <Fragment key={x}>
            <Polygon
              points={`${x},58 ${x - 9},78 ${x + 9},78`}
              fill="#12302a"
              opacity="0.9"
            />
            <Polygon
              points={`${x},44 ${x - 7},64 ${x + 7},64`}
              fill="#16382e"
              opacity="0.95"
            />
            <Polygon
              points={`${x},33 ${x - 5},52 ${x + 5},52`}
              fill="#12302a"
              opacity="0.85"
            />
            <Rect
              x={x - 2}
              y="78"
              width="4"
              height="10"
              fill="#0a1e18"
              opacity="0.8"
            />
          </Fragment>
        ))}
      </Svg>
    ),
  },
  {
    id: "waves",
    label: "Waves",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Rect x="0" y="0" width="100" height="100" fill="#bfdbfe" />
        <Path
          d="M0 45 Q25 35 50 43 Q75 51 100 41 L100 62 Q75 70 50 62 Q25 54 0 62 Z"
          fill="#93c5fd"
          opacity="0.6"
        />
        <Path
          d="M0 60 Q25 50 50 58 Q75 66 100 56 L100 78 Q75 86 50 78 Q25 70 0 78 Z"
          fill="#60a5fa"
          opacity="0.65"
        />
        <Path
          d="M0 75 Q25 65 50 73 Q75 81 100 71 L100 100 L0 100 Z"
          fill="#3b82f6"
          opacity="0.7"
        />
        <Path
          d="M0 88 Q25 80 50 86 Q75 92 100 84 L100 100 L0 100 Z"
          fill="#1d4ed8"
          opacity="0.75"
        />
      </Svg>
    ),
  },
  {
    id: "pink-clouds",
    label: "Sunset Clouds",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="pinkCloudsG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fbbf24" />
            <Stop offset="0.4" stopColor="#f472b6" />
            <Stop offset="0.75" stopColor="#e879f9" />
            <Stop offset="1" stopColor="#a78bfa" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#pinkCloudsG)" />
        <Ellipse cx="20" cy="35" rx="18" ry="9" fill="white" opacity="0.45" />
        <Ellipse cx="32" cy="29" rx="14" ry="10" fill="white" opacity="0.45" />
        <Ellipse cx="66" cy="20" rx="20" ry="10" fill="white" opacity="0.4" />
        <Ellipse cx="79" cy="28" rx="13" ry="8" fill="white" opacity="0.35" />
        <Ellipse cx="42" cy="60" rx="16" ry="7" fill="white" opacity="0.3" />
        <Ellipse cx="54" cy="55" rx="12" ry="8" fill="white" opacity="0.3" />
        <Ellipse cx="10" cy="58" rx="10" ry="5" fill="white" opacity="0.25" />
      </Svg>
    ),
  },
  {
    id: "grid",
    label: "Grid",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Rect x="0" y="0" width="100" height="100" fill="#06060f" />
        {([10, 20, 30, 40, 50, 60, 70, 80, 90] as number[]).map((v) => (
          <Fragment key={v}>
            <Line
              x1={v}
              y1="0"
              x2={v}
              y2="100"
              stroke="#3b82f6"
              strokeWidth="0.5"
              opacity="0.7"
            />
            <Line
              x1="0"
              y1={v}
              x2="100"
              y2={v}
              stroke="#3b82f6"
              strokeWidth="0.5"
              opacity="0.7"
            />
          </Fragment>
        ))}
      </Svg>
    ),
  },
  {
    id: "squiggles",
    label: "Squiggles",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Rect x="0" y="0" width="100" height="100" fill="#f5f0eb" />
        {([8, 18, 28, 38, 48, 58, 68, 78, 88, 96] as number[]).map((y) => (
          <Path
            key={y}
            d={`M0 ${y} C10 ${y - 5} 15 ${y + 5} 25 ${y} C35 ${y - 5} 40 ${y + 5} 50 ${y} C60 ${y - 5} 65 ${y + 5} 75 ${y} C85 ${y - 5} 90 ${y + 5} 100 ${y}`}
            stroke="#3b82f6"
            strokeWidth="1.2"
            fill="none"
            opacity="0.55"
          />
        ))}
      </Svg>
    ),
  },
  {
    id: "starry",
    label: "Starry Night",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="starryG" x1="0" y1="0" x2="0.2" y2="1">
            <Stop offset="0" stopColor="#020b18" />
            <Stop offset="1" stopColor="#0f172a" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#starryG)" />
        {(
          [
            [8, 8],
            [18, 15],
            [32, 5],
            [45, 12],
            [58, 8],
            [72, 15],
            [85, 10],
            [92, 22],
            [5, 28],
            [15, 35],
            [28, 25],
            [40, 32],
            [55, 22],
            [68, 30],
            [82, 25],
            [95, 38],
            [10, 48],
            [22, 55],
            [38, 42],
            [50, 52],
            [65, 45],
            [78, 55],
            [88, 48],
            [3, 65],
            [18, 72],
            [30, 60],
            [45, 70],
            [60, 63],
            [75, 75],
            [90, 68],
            [12, 88],
            [42, 85],
            [58, 92],
            [72, 88],
            [88, 95],
            [25, 95],
          ] as [number, number][]
        ).map(([x, y], i) => (
          <Circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={i % 8 === 0 ? 1.4 : 0.7}
            fill="white"
            opacity={0.45 + (i % 5) * 0.12}
          />
        ))}
      </Svg>
    ),
  },
  {
    id: "meadow",
    label: "Meadow",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="meadowG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#6ee7b7" />
            <Stop offset="0.5" stopColor="#34d399" />
            <Stop offset="1" stopColor="#059669" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#meadowG)" />
        {([8, 18, 28, 38, 50, 60, 70, 80, 92] as number[]).map((x, i) => {
          const top = 55 + (i % 3) * 10;
          return (
            <Fragment key={x}>
              <Path
                d={`M${x} 100 L${x} ${top}`}
                stroke="white"
                strokeWidth="1"
                opacity="0.65"
              />
              <Circle cx={x} cy={top} r="3.5" fill="white" opacity="0.75" />
              <Path
                d={`M${x - 5} ${top + 10} Q${x} ${top + 4} ${x + 5} ${top + 10}`}
                stroke="white"
                strokeWidth="1"
                fill="none"
                opacity="0.4"
              />
            </Fragment>
          );
        })}
      </Svg>
    ),
  },
  {
    id: "sun",
    label: "Sunshine",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Rect x="0" y="0" width="100" height="100" fill="#fbbf24" />
        {Array.from({ length: 18 }, (_, i) => {
          const angle = (i * 360) / 18;
          const rad = (angle * Math.PI) / 180;
          return (
            <Line
              key={angle}
              x1={50 + Math.cos(rad) * 28}
              y1={50 + Math.sin(rad) * 28}
              x2={50 + Math.cos(rad) * 50}
              y2={50 + Math.sin(rad) * 50}
              stroke="#f59e0b"
              strokeWidth="2.5"
              opacity="0.7"
            />
          );
        })}
        <Circle cx="50" cy="50" r="22" fill="#fde68a" opacity="0.6" />
      </Svg>
    ),
  },
  {
    id: "lightning",
    label: "Lightning",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="lightningG" x1="0.2" y1="0" x2="0.8" y2="1">
            <Stop offset="0" stopColor="#08081a" />
            <Stop offset="1" stopColor="#1e1b4b" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#lightningG)" />
        <Path
          d="M58 2 L36 46 L48 46 L30 98 L62 42 L50 42 L66 2 Z"
          fill="#a78bfa"
          opacity="0.55"
        />
        <Path
          d="M58 2 L36 46 L48 46 L30 98 L62 42 L50 42 L66 2 Z"
          stroke="#e0d7ff"
          strokeWidth="0.8"
          fill="none"
          opacity="0.9"
        />
        <Path
          d="M58 2 L36 46 L48 46 L30 98 L62 42 L50 42 L66 2 Z"
          fill="white"
          opacity="0.12"
        />
      </Svg>
    ),
  },
  {
    id: "camo",
    label: "Camo",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Rect x="0" y="0" width="100" height="100" fill="#d4c9b0" />
        <Path
          d="M8 2 Q24 -2 36 14 Q48 30 32 36 Q16 42 4 26 Q-4 12 8 2 Z"
          fill="#8a9a70"
          opacity="0.82"
        />
        <Path
          d="M58 8 Q74 2 80 18 Q86 36 70 40 Q54 44 50 26 Q48 12 58 8 Z"
          fill="#6b7c55"
          opacity="0.78"
        />
        <Path
          d="M14 52 Q30 46 40 60 Q50 74 34 80 Q18 86 10 70 Q4 56 14 52 Z"
          fill="#7a8a60"
          opacity="0.82"
        />
        <Path
          d="M62 48 Q80 42 90 58 Q100 74 82 82 Q64 88 58 70 Q52 56 62 48 Z"
          fill="#8a9a70"
          opacity="0.78"
        />
        <Path
          d="M38 28 Q56 22 62 38 Q68 56 50 60 Q34 64 30 46 Q26 32 38 28 Z"
          fill="#9aaa78"
          opacity="0.72"
        />
        <Path
          d="M-6 78 Q10 72 22 86 Q34 100 12 100 L-6 100 Z"
          fill="#6b7c55"
          opacity="0.72"
        />
        <Path
          d="M76 72 Q92 66 102 82 L102 100 L78 100 Q68 94 76 72 Z"
          fill="#7a8a60"
          opacity="0.78"
        />
      </Svg>
    ),
  },
  {
    id: "city",
    label: "City Night",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="cityG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1e1b4b" />
            <Stop offset="0.55" stopColor="#7c3aed" />
            <Stop offset="0.8" stopColor="#9333ea" />
            <Stop offset="1" stopColor="#c026d3" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#cityG)" />
        <Rect x="0" y="72" width="100" height="28" fill="black" opacity="0.3" />
        <Rect x="0" y="55" width="12" height="45" fill="#080612" />
        <Rect x="14" y="38" width="8" height="62" fill="#060410" />
        <Rect x="24" y="48" width="10" height="52" fill="#080612" />
        <Rect x="36" y="32" width="7" height="68" fill="#060410" />
        <Rect x="45" y="60" width="8" height="40" fill="#080612" />
        <Rect x="55" y="44" width="10" height="56" fill="#060410" />
        <Rect x="67" y="54" width="8" height="46" fill="#080612" />
        <Rect x="77" y="36" width="7" height="64" fill="#060410" />
        <Rect x="86" y="50" width="14" height="50" fill="#080612" />
        {(
          [
            [16, 42],
            [16, 52],
            [16, 62],
            [38, 36],
            [38, 46],
            [38, 58],
            [57, 48],
            [57, 58],
            [79, 40],
            [79, 52],
            [89, 56],
          ] as [number, number][]
        ).map(([x, y]) => (
          <Rect
            key={`w${x}-${y}`}
            x={x}
            y={y}
            width="2.5"
            height="3"
            fill="#fbbf24"
            opacity="0.75"
          />
        ))}
        {(
          [
            [15, 8],
            [30, 5],
            [50, 12],
            [70, 7],
            [85, 15],
            [5, 20],
            [45, 18],
            [92, 10],
          ] as [number, number][]
        ).map(([x, y]) => (
          <Circle
            key={`s${x}-${y}`}
            cx={x}
            cy={y}
            r="0.8"
            fill="white"
            opacity="0.7"
          />
        ))}
      </Svg>
    ),
  },
  {
    id: "holographic",
    label: "Holographic",
    render: (sz) => (
      <Svg width={sz} height={sz} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="holoG" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#22d3ee" />
            <Stop offset="0.25" stopColor="#a78bfa" />
            <Stop offset="0.5" stopColor="#f472b6" />
            <Stop offset="0.75" stopColor="#86efac" />
            <Stop offset="1" stopColor="#fbbf24" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#holoG)" />
        <Rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="white"
          opacity="0.18"
        />
      </Svg>
    ),
  },
];

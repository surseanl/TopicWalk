// Custom SVG hunt icons for Solo Hunt — 50 symbols, no emojis
import type { ComponentType } from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";

type P = { size?: number; color?: string; strokeWidth?: number };

function mk(fn: (c: string) => React.ReactNode): ComponentType<P> {
  return function HuntIcon({
    size = 24,
    color = "#fff",
    strokeWidth = 1.8,
  }: P) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {fn(color)}
        </G>
      </Svg>
    );
  };
}

// ── Wildlife ──────────────────────────────────────────────────────────────────

// 1. Animal – paw print (5 filled pads)
export const IcoAnimal = mk((c) => (
  <>
    <Circle cx="12" cy="16" r="3.5" fill={c} stroke="none" />
    <Circle cx="6.5" cy="10.5" r="2" fill={c} stroke="none" />
    <Circle cx="11" cy="8" r="2" fill={c} stroke="none" />
    <Circle cx="15.5" cy="8" r="2" fill={c} stroke="none" />
    <Circle cx="19" cy="11.5" r="2" fill={c} stroke="none" />
  </>
));

// 2. Insect – top-down bug: oval body, round head, 6 legs, antennae
export const IcoInsect = mk(() => (
  <>
    <Ellipse cx="12" cy="14" rx="3" ry="4.5" />
    <Circle cx="12" cy="8.5" r="2.5" />
    <Line x1="11" y1="7" x2="8.5" y2="4.5" />
    <Line x1="13" y1="7" x2="15.5" y2="4.5" />
    <Line x1="9" y1="11.5" x2="5" y2="10.5" />
    <Line x1="9" y1="14.5" x2="5" y2="14.5" />
    <Line x1="9" y1="17" x2="5" y2="18.5" />
    <Line x1="15" y1="11.5" x2="19" y2="10.5" />
    <Line x1="15" y1="14.5" x2="19" y2="14.5" />
    <Line x1="15" y1="17" x2="19" y2="18.5" />
  </>
));

// 3. Bird – side profile, wing line, tail feathers, beak
export const IcoBird = mk((c) => (
  <>
    <Path d="M4 14 Q9 10 15 13 Q17 14 19 11" />
    <Circle cx="19.5" cy="9.5" r="2.2" />
    <Path d="M21 9 L23.5 8.5 L22 10.5 Z" fill={c} stroke="none" />
    <Circle cx="20" cy="8.8" r="0.6" fill={c} stroke="none" />
    <Path d="M4 14 L1.5 12 M4 14.5 L1.5 15.5 M4 15 L2 17.5" />
    <Path d="M9 16 L8 19.5 M12 16.5 L12 20" />
    <Path d="M7 13 Q12 9 17 12" />
  </>
));

// 4. Animal Evidence – feather (curved quill + alternating barbs)
export const IcoAnimalEvidence = mk((c) => (
  <>
    <Path d="M13.5 3.5 Q11.5 11 10 20.5" />
    <Path d="M13.5 4.5 Q16.5 6.5 17 5.5" />
    <Path d="M13 7 Q16.5 9.5 17 8.5" />
    <Path d="M12.5 9.5 Q15.5 12 16 11" />
    <Path d="M12 12 Q14.5 14.5 15 13.5" />
    <Path d="M11.5 14.5 Q13.5 16.5 14 15.5" />
    <Path d="M13.5 4.5 Q10.5 6 10 5" />
    <Path d="M13 7 Q10 9 9.5 8" />
    <Path d="M12.5 9.5 Q9.5 11.5 9 10.5" />
    <Path d="M12 12 Q9.5 14 9 13" />
    <Path d="M11.5 14.5 Q9.5 16 9 15.2" />
    <Circle cx="14" cy="3.2" r="0.7" fill={c} stroke="none" />
  </>
));

// ── Nature ────────────────────────────────────────────────────────────────────

// 5. Tree – layered canopy + trunk
export const IcoTree = mk((c) => (
  <>
    <Rect
      x="10.5"
      y="17"
      width="3"
      height="5"
      rx="0.5"
      fill={c}
      stroke="none"
    />
    <Path
      d="M12 2 L5 12 H9 L6.5 17 H17.5 L15 12 H19 Z"
      fill={c}
      stroke="none"
    />
  </>
));

// 6. Flower – 5 petals (circles at 72°) + filled center + stem
export const IcoFlower = mk((c) => (
  <>
    <Circle cx="12" cy="7.7" r="2.5" />
    <Circle cx="15.9" cy="10.5" r="2.5" />
    <Circle cx="14.4" cy="15" r="2.5" />
    <Circle cx="9.6" cy="15" r="2.5" />
    <Circle cx="8.1" cy="10.5" r="2.5" />
    <Circle cx="12" cy="12" r="2.8" fill={c} />
    <Line x1="12" y1="21" x2="12" y2="17" />
    <Path d="M12 19 Q9.5 18 8 19" />
  </>
));

// 7. Plant – vertical stem + two curved leaves
export const IcoPlant = mk((c) => (
  <>
    <Line x1="12" y1="22" x2="12" y2="4" />
    <Path d="M12 15 Q6 11 4 13.5 Q6 17 12 15 Z" fill={c} stroke="none" />
    <Path d="M12 10 Q18 6 20 8.5 Q18 12 12 10 Z" fill={c} stroke="none" />
    <Path d="M12 4 Q11.5 2 11 1.5" />
  </>
));

// 8. Mushroom – dome cap + stem + spots
export const IcoMushroom = mk(() => (
  <>
    <Path d="M9 22 L9 16 Q9 14 12 14 Q15 14 15 16 L15 22" />
    <Path d="M5.5 15 Q5.5 5.5 12 4.5 Q18.5 5.5 18.5 15 Z" />
    <Circle cx="9.5" cy="11" r="1.5" />
    <Circle cx="14.5" cy="10" r="1.5" />
    <Circle cx="12" cy="13.5" r="1" />
  </>
));

// 9. Fallen Nature – leaf with midrib and side veins
export const IcoFallenNature = mk(() => (
  <>
    <Path d="M12 2.5 Q20 8 20 14 Q20 21 12 22 Q4 21 4 14 Q4 8 12 2.5 Z" />
    <Line x1="12" y1="2.5" x2="12" y2="22" />
    <Path d="M12 8 Q15.5 10 17.5 9.5" />
    <Path d="M12 12 Q15.5 14 17 13.5" />
    <Path d="M12 16 Q15 18 15.5 17.5" />
    <Path d="M12 8 Q8.5 10 6.5 9.5" />
    <Path d="M12 12 Q8.5 14 7 13.5" />
    <Path d="M12 16 Q9 18 8.5 17.5" />
  </>
));

// 10. Rock – rounded boulder + crack
export const IcoRock = mk(() => (
  <>
    <Path d="M5 19 Q3.5 14 6.5 10 Q9.5 6 15 7 Q20.5 8 21.5 13 Q22.5 18 19.5 20 Q14.5 22.5 9 21.5 Q5.5 20.5 5 19 Z" />
    <Path d="M8 13.5 Q12 12 17 14.5" />
    <Path d="M10 10 Q11 12 10.5 14" />
  </>
));

// 11. Moss or Lichen – ground line with bumpy growths + dots
export const IcoMoss = mk((c) => (
  <>
    <Line x1="3" y1="17" x2="21" y2="17" />
    <Path d="M4 17 Q4.5 13.5 6 13.5 Q7.5 13.5 8 17" />
    <Path d="M8 17 Q8.5 12.5 10 12.5 Q11.5 12.5 12 17" />
    <Path d="M12 17 Q12.5 13.5 14 13.5 Q15.5 13.5 16 17" />
    <Path d="M16 17 Q16.5 12.5 18 12.5 Q19.5 12.5 20 17" />
    <Circle cx="6" cy="11.5" r="0.8" fill={c} stroke="none" />
    <Circle cx="10" cy="10.5" r="0.8" fill={c} stroke="none" />
    <Circle cx="14" cy="11" r="0.8" fill={c} stroke="none" />
    <Circle cx="18" cy="10.5" r="0.8" fill={c} stroke="none" />
  </>
));

// ── Sky & Weather ─────────────────────────────────────────────────────────────

// 12. Cloud – puffy cloud
export const IcoCloud = mk(() => (
  <>
    <Path d="M8 18 Q5 18 4 16 Q3 14 5 12.5 Q5 9.5 8 9 Q9 7 12 6.5 Q15.5 6 17 8 Q19 7 21 9 Q23 10 22 13 Q21 16 18.5 16 L8 18 Z" />
  </>
));

// 13. Sun – circle + 8 rays
export const IcoSun = mk(() => (
  <>
    <Circle cx="12" cy="12" r="4" />
    <Line x1="12" y1="2" x2="12" y2="5" />
    <Line x1="12" y1="19" x2="12" y2="22" />
    <Line x1="2" y1="12" x2="5" y2="12" />
    <Line x1="19" y1="12" x2="22" y2="12" />
    <Line x1="4.9" y1="4.9" x2="7" y2="7" />
    <Line x1="17" y1="17" x2="19.1" y2="19.1" />
    <Line x1="4.9" y1="19.1" x2="7" y2="17" />
    <Line x1="17" y1="7" x2="19.1" y2="4.9" />
  </>
));

// 14. Moon – crescent (outer arc + inner arc)
export const IcoMoon = mk((c) => (
  <>
    <Path
      d="M19 12.5 A7.5 7.5 0 1 1 11.5 5 A5 5 0 0 0 19 12.5 Z"
      fill={c}
      stroke="none"
    />
    <Circle cx="17.5" cy="6.5" r="0.8" fill={c} stroke="none" />
    <Circle cx="19.5" cy="9" r="0.5" fill={c} stroke="none" />
    <Circle cx="15" cy="4.5" r="0.5" fill={c} stroke="none" />
  </>
));

// 15. Sunrise or Sunset – horizon line + half circle sun + radiating rays
export const IcoSunrise = mk(() => (
  <>
    <Line x1="2" y1="15" x2="22" y2="15" />
    <Path d="M6.5 15 A5.5 5.5 0 0 1 17.5 15" />
    <Line x1="12" y1="5" x2="12" y2="8" />
    <Line x1="5.5" y1="7.5" x2="7.5" y2="9.5" />
    <Line x1="18.5" y1="7.5" x2="16.5" y2="9.5" />
    <Line x1="3" y1="13" x2="5.5" y2="13.5" />
    <Line x1="21" y1="13" x2="18.5" y2="13.5" />
    <Line x1="18" y1="18" x2="20.5" y2="19" />
    <Line x1="6" y1="18" x2="3.5" y2="19" />
  </>
));

// 16. Rain – cloud + diagonal raindrops
export const IcoRain = mk(() => (
  <>
    <Path d="M7.5 11.5 Q5.5 11.5 4.5 9.5 Q4 7.5 6 6.5 Q6.5 4.5 9 4 Q11.5 3.5 13 5 Q14.5 4 16.5 5 Q18.5 6 18 8.5 Q19.5 9 19.5 11 Q19 12.5 17.5 12.5 Z" />
    <Line x1="8" y1="15" x2="6" y2="19.5" />
    <Line x1="12" y1="15" x2="10" y2="19.5" />
    <Line x1="16" y1="15" x2="14" y2="19.5" />
    <Line x1="19.5" y1="15" x2="17.5" y2="19.5" />
  </>
));

// 17. Rainbow – 3 concentric arcs + ground
export const IcoRainbow = mk(() => (
  <>
    <Line x1="2" y1="18" x2="22" y2="18" />
    <Path d="M4.5 18 A7.5 7.5 0 0 1 19.5 18" />
    <Path d="M3 18 A9 9 0 0 1 21 18" />
    <Path d="M1.5 18 A10.5 10.5 0 0 1 22.5 18" />
    <Circle cx="3" cy="18" r="1.5" />
    <Circle cx="21" cy="18" r="1.5" />
  </>
));

// ── Environment ───────────────────────────────────────────────────────────────

// 18. Water – 3 wavy lines
export const IcoWater = mk(() => (
  <>
    <Path d="M3 9 Q5.5 6.5 8 9 Q10.5 11.5 13 9 Q15.5 6.5 18 9 Q20.5 11.5 22 9" />
    <Path d="M3 13.5 Q5.5 11 8 13.5 Q10.5 16 13 13.5 Q15.5 11 18 13.5 Q20.5 16 22 13.5" />
    <Path d="M3 18 Q5.5 15.5 8 18 Q10.5 20.5 13 18 Q15.5 15.5 18 18 Q20.5 20.5 22 18" />
  </>
));

// 19. Bridge – arch + deck + suspender cables
export const IcoBridge = mk(() => (
  <>
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Line x1="5" y1="12" x2="5" y2="20" />
    <Line x1="19" y1="12" x2="19" y2="20" />
    <Path d="M5 12 Q12 5 19 12" />
    <Line x1="8" y1="12" x2="8.8" y2="8" />
    <Line x1="10.5" y1="12" x2="11" y2="6.5" />
    <Line x1="13.5" y1="12" x2="13" y2="6.5" />
    <Line x1="16" y1="12" x2="15.2" y2="8" />
    <Line x1="2" y1="20" x2="22" y2="20" />
  </>
));

// 20. Path or Trail – winding double-line path with dashes
export const IcoPath = mk(() => (
  <>
    <Path d="M5 21 Q4 17 8 14 Q12 11 12 8 Q12 5 16 4" />
    <Path d="M9 21 Q8 17 12 14 Q16 11 16 8 Q16 5 20 4" />
    <Line x1="7.5" y1="17.5" x2="9.5" y2="16.5" strokeDasharray="1 2" />
    <Line x1="11" y1="12.5" x2="13" y2="11.5" strokeDasharray="1 2" />
    <Line x1="14" y1="7" x2="16" y2="6" strokeDasharray="1 2" />
  </>
));

// 21. Interesting Building – tall building with dome and arched window
export const IcoBuilding = mk((c) => (
  <>
    <Rect x="6" y="11" width="12" height="11" />
    <Path d="M8 22 L8 11 M12 22 L12 11 M16 22 L16 11" />
    <Path d="M6 11 Q12 4 18 11" />
    <Path d="M10 15 Q12 13 14 15 L14 19 L10 19 Z" />
    <Circle cx="12" cy="8" r="1" fill={c} stroke="none" />
    <Line x1="12" y1="4" x2="12" y2="7" />
    <Rect x="7.5" y="12.5" width="2" height="2.5" rx="0.3" />
    <Rect x="14.5" y="12.5" width="2" height="2.5" rx="0.3" />
  </>
));

// 22. Landmark – map pin with star inside
export const IcoLandmark = mk((c) => (
  <>
    <Path d="M12 2 Q18 2 18 9 Q18 14 12 22 Q6 14 6 9 Q6 2 12 2 Z" />
    <Path
      d="M12 6 L12.8 8.5 H15.5 L13.3 10 L14.1 12.5 L12 11 L9.9 12.5 L10.7 10 L8.5 8.5 H11.2 Z"
      fill={c}
      stroke="none"
    />
  </>
));

// 23. Street Sign – post + sign with text lines
export const IcoStreetSign = mk(() => (
  <>
    <Line x1="12" y1="22" x2="12" y2="13" />
    <Rect x="4" y="5" width="16" height="8" rx="1.5" />
    <Line x1="7" y1="8.5" x2="17" y2="8.5" />
    <Line x1="7" y1="10.5" x2="14" y2="10.5" />
    <Path d="M4 8.5 L2 7 M4 8.5 L2 10" />
    <Line x1="7" y1="6.5" x2="10" y2="6.5" />
  </>
));

// 24. Crosswalk – zebra crossing stripes in road rectangle
export const IcoCrosswalk = mk(() => (
  <>
    <Rect x="4" y="6" width="16" height="12" rx="1" />
    <Line x1="4" y1="9.5" x2="20" y2="9.5" />
    <Line x1="4" y1="12" x2="20" y2="12" />
    <Line x1="4" y1="14.5" x2="20" y2="14.5" />
    <Line x1="7" y1="6" x2="7" y2="18" />
    <Line x1="12" y1="6" x2="12" y2="18" />
    <Line x1="17" y1="6" x2="17" y2="18" />
  </>
));

// 25. Bench – side view with seat plank, back, and two legs
export const IcoBench = mk(() => (
  <>
    <Line x1="3" y1="14" x2="21" y2="14" />
    <Line x1="4" y1="11" x2="20" y2="11" />
    <Line x1="6" y1="14" x2="6" y2="20" />
    <Line x1="18" y1="14" x2="18" y2="20" />
    <Line x1="4" y1="11" x2="4" y2="7" />
    <Line x1="20" y1="11" x2="20" y2="7" />
    <Line x1="4" y1="7" x2="20" y2="7" />
  </>
));

// 26. Sports Area – H-shaped goal posts
export const IcoSports = mk(() => (
  <>
    <Line x1="8" y1="4" x2="8" y2="22" />
    <Line x1="16" y1="4" x2="16" y2="22" />
    <Line x1="8" y1="11" x2="16" y2="11" />
    <Line x1="4" y1="4" x2="8" y2="4" />
    <Line x1="16" y1="4" x2="20" y2="4" />
    <Rect x="5" y="18" width="14" height="3" rx="0.5" />
  </>
));

// 27. Transportation – bus (rounded rect + windows + wheels)
export const IcoTransportation = mk(() => (
  <>
    <Path d="M3 8 Q3 5 6 5 L19 5 Q22 5 22 8 L22 18 Q22 19.5 20.5 19.5 L3.5 19.5 Q2 19.5 2 18 L2 9 Z" />
    <Line x1="2" y1="14" x2="22" y2="14" />
    <Rect x="4" y="8" width="4" height="4" rx="0.5" />
    <Rect x="10" y="8" width="4" height="4" rx="0.5" />
    <Rect x="16" y="8" width="4" height="4" rx="0.5" />
    <Circle cx="7" cy="21" r="2" />
    <Circle cx="17" cy="21" r="2" />
    <Line x1="2" y1="11" x2="2" y2="9" />
  </>
));

// 28. Outdoor Activity – hiker with staff and mountain silhouette
export const IcoOutdoor = mk((c) => (
  <>
    <Path d="M2 20 L8 8 L14 20" />
    <Path d="M10 20 L16 10 L22 20" />
    <Circle cx="16" cy="6.5" r="2.5" />
    <Line x1="16" y1="9" x2="15" y2="14" />
    <Line x1="15" y1="14" x2="12" y2="19.5" />
    <Line x1="15" y1="14" x2="18" y2="19.5" />
    <Line x1="13" y1="11.5" x2="16" y2="13" />
    <Line x1="18.5" y1="14" x2="21" y2="17" />
    <Circle cx="16" cy="5" r="0.8" fill={c} stroke="none" />
  </>
));

// 29. Fence or Gate – two rails + 5 pointed pickets
export const IcoFence = mk((c) => (
  <>
    <Line x1="2" y1="10" x2="22" y2="10" />
    <Line x1="2" y1="15" x2="22" y2="15" />
    <Path d="M4 20 L4 8 L5 6 L6 8 L6 20" fill={c} stroke="none" />
    <Path d="M8 20 L8 8 L9 6 L10 8 L10 20" fill={c} stroke="none" />
    <Path d="M12 20 L12 8 L13 6 L14 8 L14 20" fill={c} stroke="none" />
    <Path d="M16 20 L16 8 L17 6 L18 8 L18 20" fill={c} stroke="none" />
    <Path d="M20 20 L20 8 L21 6 L22 8 L22 20" fill={c} stroke="none" />
  </>
));

// 30. Stairs – side-view 4-step profile
export const IcoStairs = mk(() => (
  <>
    <Path d="M4 20 L4 16 L8 16 L8 12 L12 12 L12 8 L16 8 L16 4 L20 4" />
    <Path d="M4 20 H20 V4" />
  </>
));

// ── Creative Challenges ───────────────────────────────────────────────────────

// 31. Hidden Beauty – decorative eye with lashes + sparkle
export const IcoHiddenBeauty = mk((c) => (
  <>
    <Path d="M2 12 Q7 6 12 6 Q17 6 22 12 Q17 18 12 18 Q7 18 2 12 Z" />
    <Circle cx="12" cy="12" r="3.5" />
    <Circle cx="12" cy="12" r="1.5" fill={c} stroke="none" />
    <Line x1="9" y1="5.5" x2="9.5" y2="7.5" />
    <Line x1="12" y1="4.5" x2="12" y2="6.5" />
    <Line x1="15" y1="5.5" x2="14.5" y2="7.5" />
    <Line x1="20" y1="9" x2="18" y2="10" />
    <Line x1="4" y1="9" x2="6" y2="10" />
    <Path
      d="M18.5 7 L19.5 5.5 L20.5 7 L19 6.5 L18.5 7 Z"
      fill={c}
      stroke="none"
    />
  </>
));

// 32. Accidental Art – asymmetric paint splash
export const IcoAccidentalArt = mk((c) => (
  <>
    <Path
      d="M12 4 Q16 3 18 6 Q22 7 21 12 Q22 16 18 17 Q17 21 13 20 Q9 22 7 19 Q3 18 4 14 Q2 10 5 8 Q6 4 12 4 Z"
      fill={c}
      stroke="none"
    />
    <Path d="M17 20 Q19 22 18 23" />
    <Path d="M19 16 Q22 18 22 20" />
    <Path d="M7 20 Q5 22 4.5 23.5" />
    <Circle cx="10" cy="12" r="1.5" fill="none" />
    <Circle cx="14" cy="10" r="1" fill="none" />
    <Circle cx="13" cy="15" r="0.8" fill="none" />
  </>
));

// 33. Nature's Artwork – leaf shape with golden spiral inside
export const IcoNatureArtwork = mk(() => (
  <>
    <Path d="M12 3 Q20 8 20 14 Q20 21 12 22 Q4 21 4 14 Q4 8 12 3 Z" />
    <Path d="M12 19 Q16 17 16 13 Q16 9 12 9 Q10 9 10 12 Q10 14 12 14 Q13.5 14 13.5 12.5" />
  </>
));

// 34. Man-Made Artwork – easel + canvas + abstract painting
export const IcoManmadeArt = mk(() => (
  <>
    <Line x1="12" y1="5" x2="5" y2="21" />
    <Line x1="12" y1="5" x2="19" y2="21" />
    <Line x1="12" y1="13" x2="8" y2="21" />
    <Rect x="6" y="4" width="12" height="10" rx="1" />
    <Path d="M8 11 Q10 7 12 9 Q14 11 16 7" />
    <Circle cx="8.5" cy="7" r="1" />
    <Line x1="10" y1="13" x2="14" y2="13" />
  </>
));

// 35. Unexpected Combo – left half gear + right half flower petal
export const IcoUnexpectedCombo = mk((c) => (
  <>
    <Line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
    <Path d="M12 6 Q8 6 6 9 Q4 12 6 15 Q8 18 12 18 L12 6 Z" />
    <Line x1="4.5" y1="8" x2="6.5" y2="9.5" />
    <Line x1="4.5" y1="12" x2="6.5" y2="12" />
    <Line x1="4.5" y1="16" x2="6.5" y2="14.5" />
    <Circle cx="9" cy="12" r="2.5" />
    <Circle cx="15" cy="7" r="2.5" />
    <Circle cx="19" cy="10.5" r="2.5" />
    <Circle cx="19" cy="15.5" r="2.5" />
    <Circle cx="15" cy="18" r="2.5" />
    <Circle cx="15.5" cy="12.5" r="2.5" fill={c} />
  </>
));

// 36. Natural Illusion – two facing profiles forming a vase between them
export const IcoNaturalIllusion = mk(() => (
  <>
    <Path d="M7 2 Q5 5 6 8 Q5 10 6 12 Q5 14 6 16 Q5 19 7 22 L12 22 L12 2 Z" />
    <Path d="M17 2 Q19 5 18 8 Q19 10 18 12 Q19 14 18 16 Q19 19 17 22 L12 22 L12 2 Z" />
  </>
));

// 37. Perfect Match – two mirrored leaf shapes
export const IcoPerfectMatch = mk(() => (
  <>
    <Path d="M11 5 Q6 7 5 12 Q6 17 11 19 Q12 14 12 12 Q12 10 11 5 Z" />
    <Path d="M13 5 Q18 7 19 12 Q18 17 13 19 Q12 14 12 12 Q12 10 13 5 Z" />
    <Line x1="11" y1="5" x2="12" y2="19" />
    <Line x1="13" y1="5" x2="12" y2="19" />
  </>
));

// 38. Leading Lines – 5 converging perspective lines
export const IcoLeadingLines = mk(() => (
  <>
    <Line x1="2" y1="22" x2="12" y2="6" />
    <Line x1="7" y1="22" x2="12" y2="6" />
    <Line x1="12" y1="22" x2="12" y2="6" />
    <Line x1="17" y1="22" x2="12" y2="6" />
    <Line x1="22" y1="22" x2="12" y2="6" />
    <Line x1="2" y1="16" x2="22" y2="16" />
    <Line x1="3.5" y1="22" x2="20.5" y2="22" />
  </>
));

// 39. Hidden Detail – magnifying glass over a dotted surface
export const IcoHiddenDetail = mk((c) => (
  <>
    <Circle cx="10" cy="10" r="6.5" />
    <Line x1="15" y1="15" x2="21" y2="21" />
    <Circle cx="9" cy="9" r="1.2" fill={c} stroke="none" />
    <Circle cx="12" cy="8" r="1" fill={c} stroke="none" />
    <Circle cx="10" cy="12" r="1" fill={c} stroke="none" />
    <Circle cx="7" cy="11" r="0.8" fill={c} stroke="none" />
    <Circle cx="12.5" cy="11.5" r="0.7" fill={c} stroke="none" />
    <Circle cx="8" cy="7" r="0.7" fill={c} stroke="none" />
  </>
));

// 40. Natural Camouflage – deer silhouette with leaf-line texture
export const IcoCamouflage = mk(() => (
  <>
    <Path d="M12 19 Q8 18 7 15 Q6 12 8 10 Q9 8 12 8 Q15 8 16 10 Q18 12 17 15 Q16 18 12 19 Z" />
    <Path d="M10 8 Q9 5 7 4 M12 8 Q12 5 12 3 M14 8 Q15 5 17 4" />
    <Path d="M8.5 10 Q5 9 4 11" />
    <Path d="M15.5 10 Q19 9 20 11" />
    <Path d="M9 13 Q6 14 5 16 M15 13 Q18 14 19 16" />
    <Line x1="10" y1="11" x2="14" y2="11" />
    <Line x1="9.5" y1="14" x2="14.5" y2="14" />
    <Line x1="10" y1="17" x2="14" y2="17" />
    <Line x1="12" y1="19" x2="11" y2="22" />
    <Line x1="12" y1="19" x2="13" y2="22" />
  </>
));

// 41. Optical Illusion – concentric circles with radial lines
export const IcoOpticalIllusion = mk(() => (
  <>
    <Circle cx="12" cy="12" r="9" />
    <Circle cx="12" cy="12" r="6" />
    <Circle cx="12" cy="12" r="3" />
    <Line x1="12" y1="3" x2="12" y2="21" />
    <Line x1="3" y1="12" x2="21" y2="12" />
    <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
    <Line x1="18.4" y1="5.6" x2="5.6" y2="18.4" />
  </>
));

// 42. Unexpected Scale – large mushroom + tiny stick figure beside it
export const IcoUnexpectedScale = mk((c) => (
  <>
    <Path d="M6 21 L6 16 Q6 14 9 14 Q12 14 12 16 L12 21" />
    <Path d="M3 15 Q3 7 9 6 Q15 7 15 15 Z" />
    <Circle cx="9" cy="10.5" r="1.2" />
    <Circle cx="12.5" cy="10" r="1" />
    <Line x1="20" y1="17" x2="20" y2="21" />
    <Circle cx="20" cy="15.5" r="1.2" />
    <Line x1="18" y1="18.5" x2="22" y2="18.5" />
    <Line x1="19" y1="21" x2="18" y2="22.5" />
    <Line x1="21" y1="21" x2="22" y2="22.5" />
    <Circle cx="6.5" cy="4" r="0.6" fill={c} stroke="none" />
  </>
));

// 43. Letter Hunt – bold block letter A
export const IcoLetterHunt = mk((c) => (
  <>
    <Path d="M4 21 L12 3 L20 21" />
    <Line x1="7.5" y1="14" x2="16.5" y2="14" />
    <Path d="M12 3 Q13 5 12 7 Q11 5 12 3 Z" fill={c} stroke="none" />
    <Path d="M7.5 14 Q9 12 10.5 14" strokeDasharray="0.5 1" />
    <Path d="M13.5 14 Q15 12 16.5 14" strokeDasharray="0.5 1" />
  </>
));

// 44. Number Hunt – bold number 7 with branch texture
export const IcoNumberHunt = mk(() => (
  <>
    <Path d="M5.5 5 L18.5 5 L10 22" />
    <Line x1="8.5" y1="13" x2="14" y2="13" />
    <Path d="M13 10 Q15 9 16 10" />
    <Path d="M11.5 16 Q12.5 15 14 16" />
  </>
));

// 45. Perfect Balance – balance scale (beam + fulcrum + two hanging pans)
export const IcoPerfectBalance = mk(() => (
  <>
    <Line x1="12" y1="4" x2="12" y2="20" />
    <Path d="M10 20 L12 17 L14 20 Z" />
    <Line x1="4" y1="9" x2="20" y2="9" />
    <Line x1="5" y1="9" x2="5" y2="14" />
    <Path d="M3 14 Q5 16.5 7 14" />
    <Line x1="19" y1="9" x2="19" y2="14" />
    <Path d="M17 14 Q19 16.5 21 14" />
    <Circle cx="5" cy="8" r="1" />
    <Circle cx="19" cy="8" r="1" />
  </>
));

// 46. Sound of the Walk – footprint + three sound-wave arcs
export const IcoSoundOfWalk = mk(() => (
  <>
    <Ellipse cx="8" cy="16" rx="2.5" ry="3.5" transform="rotate(-20 8 16)" />
    <Ellipse cx="8" cy="16" rx="1" ry="1.5" transform="rotate(-20 8 16)" />
    <Path d="M13 10 Q16 13 13 16" />
    <Path d="M15 8 Q20 12 15 17" />
    <Path d="M17 6 Q24 12 17 19" />
    <Line x1="6" y1="21" x2="10" y2="20" />
    <Line x1="5.5" y1="19" x2="5.5" y2="21" />
  </>
));

// 47. Follow the Trail – curved dotted footprint path
export const IcoFollowTrail = mk((c) => (
  <>
    <Path d="M4 20 Q6 16 10 14 Q14 12 16 9 Q18 6 20 4" strokeDasharray="3 2" />
    <Ellipse
      cx="5"
      cy="20"
      rx="1.5"
      ry="2"
      transform="rotate(20 5 20)"
      fill={c}
      stroke="none"
    />
    <Ellipse
      cx="10"
      cy="14.5"
      rx="1.5"
      ry="2"
      transform="rotate(-10 10 14.5)"
      fill={c}
      stroke="none"
    />
    <Ellipse
      cx="15"
      cy="10"
      rx="1.5"
      ry="2"
      transform="rotate(20 15 10)"
      fill={c}
      stroke="none"
    />
    <Ellipse
      cx="19.5"
      cy="5"
      rx="1.5"
      ry="2"
      transform="rotate(-10 19.5 5)"
      fill={c}
      stroke="none"
    />
    <Path d="M18 4 L21 3 L20 5 Z" fill={c} stroke="none" />
  </>
));

// 48. Out of Place – row of 3 circles, 1 square that doesn't fit, with attention mark
export const IcoOutOfPlace = mk((c) => (
  <>
    <Circle cx="3.5" cy="13" r="2.5" />
    <Circle cx="9" cy="13" r="2.5" />
    <Circle cx="14.5" cy="13" r="2.5" />
    <Rect x="18.5" y="10" width="5" height="5" rx="0.5" />
    <Line x1="21" y1="5" x2="21" y2="8.5" />
    <Circle cx="21" cy="4" r="0.9" fill={c} stroke="none" />
  </>
));

// 49. Pattern Hunt – honeycomb hex grid (3 hexagons)
export const IcoPatternHunt = mk(() => (
  <>
    <Path d="M12 3 L15.5 5.5 L15.5 10.5 L12 13 L8.5 10.5 L8.5 5.5 Z" />
    <Path d="M15.5 5.5 L19 3 L22.5 5.5 L22.5 10.5 L19 13 L15.5 10.5" />
    <Path d="M8.5 5.5 L5 3 L1.5 5.5 L1.5 10.5 L5 13 L8.5 10.5" />
    <Path d="M8.5 10.5 L5 13 L5 18 L8.5 20.5 L12 18 L12 13" />
    <Path d="M15.5 10.5 L12 13 L12 18 L15.5 20.5 L19 18 L19 13 L15.5 10.5" />
  </>
));

// 50. Shape Hunt – circle + triangle + square + diamond arranged
export const IcoShapeHunt = mk((c) => (
  <>
    <Circle cx="6" cy="6.5" r="3.5" />
    <Path d="M15 3 L21 13 L9 13 Z" />
    <Rect x="2.5" y="15" width="7" height="7" rx="0.5" />
    <Path d="M15.5 15.5 L19 12 L22.5 15.5 L19 19 Z" />
    <Circle cx="19" cy="15.5" r="0.5" fill={c} stroke="none" />
  </>
));

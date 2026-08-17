// Colors matched to the TopicWalk brand system (globals.css)
// primary  = oklch(0.83 0.17 78)  → logo yellow "Walk"  → #FFBE59
// secondary = oklch(0.65 0.172 216) → logo teal "Topic" → #1BACD6
export const colors = {
  primary: "#FFBE59", // logo yellow — "Walk"
  secondary: "#1BACD6", // logo teal  — "Topic"
  background: "#FDFCF7", // oklch(0.99 0.004 85) warm near-white
  foreground: "#1B1B2E", // oklch(0.14 0.015 255) dark navy
  card: "#FFFFFF",
  border: "#E3E1D9", // oklch(0.90 0.008 85) warm light border
  muted: "#F3F2EB", // oklch(0.96 0.006 85) warm surface
  mutedForeground: "#63697F", // oklch(0.54 0.02 255) blue-gray
  destructive: "#ef4444",
} as const;

// Primary yellow tint — use wherever #fff7ed (amber tint) was used
export const primaryTint = "#FFF8E8";

export type WalkColor = {
  name: string;
  hex: string;
};

// Arranged for visual contrast on the wheel (no two similar adjacent)
export const WALK_COLORS: WalkColor[] = [
  { name: "Red", hex: "#FF3B30" },
  { name: "Orange", hex: "#FF9500" },
  { name: "Yellow", hex: "#FFCC00" },
  { name: "Green", hex: "#34C759" },
  { name: "Blue", hex: "#007AFF" },
  { name: "Purple", hex: "#AF52DE" },
  { name: "Pink", hex: "#FF69B4" },
  { name: "Brown", hex: "#A2845E" },
  { name: "Gray", hex: "#8E8E93" },
  { name: "Black", hex: "#1C1C1E" },
];

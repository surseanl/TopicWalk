export type WalkColor = {
  name: string;
  hex: string;
};

// Arranged for visual contrast on the wheel (no two similar adjacent)
export const WALK_COLORS: WalkColor[] = [
  { name: "Red", hex: "#FF3B30" },
  { name: "Blue", hex: "#007AFF" },
  { name: "Orange", hex: "#FF9500" },
  { name: "Teal", hex: "#00ACC1" },
  { name: "Yellow", hex: "#FFCC00" },
  { name: "Indigo", hex: "#3730A3" },
  { name: "Green", hex: "#34C759" },
  { name: "Crimson", hex: "#B91C1C" },
  { name: "Pink", hex: "#FF69B4" },
  { name: "Olive", hex: "#6B7C2A" },
  { name: "Purple", hex: "#AF52DE" },
  { name: "Gold", hex: "#F59E0B" },
  { name: "Coral", hex: "#FF7058" },
  { name: "Brown", hex: "#6F4E37" },
  { name: "White", hex: "#F5F0E8" },
  { name: "Rust", hex: "#C05621" },
  { name: "Silver", hex: "#B0B8C1" },
  { name: "Tan", hex: "#C4A882" },
  { name: "Black", hex: "#1C1C1E" },
  { name: "Gray", hex: "#8E8E93" },
];

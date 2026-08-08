export type Category = "Color" | "Shape" | "Theme" | "Object";

export const TOPICS: Record<Category, string[]> = {
  Color: [
    "Something Red",
    "Something Blue",
    "Something Yellow",
    "Something Green",
    "Something Orange",
    "Something Purple",
    "Something White",
    "Something Pink",
    "Something Brown",
    "Something Gold",
    "Something Silver",
    "Something Turquoise",
  ],
  Shape: [
    "Something Circular",
    "Something Triangular",
    "Something Square",
    "Something Curved",
    "Something Spiral",
    "Something Striped",
    "Something Checkered",
    "Something Pointed",
    "Something Hollow",
    "Something Symmetrical",
  ],
  Theme: [
    "Something Nostalgic",
    "Something Peaceful",
    "Something Surprising",
    "Something Temporary",
    "Something Ancient",
    "Something Miniature",
    "Something Abandoned",
    "Something Growing",
    "Something Fading",
    "Something Joyful",
    "Something Hidden",
  ],
  Object: [
    "A Doorknob",
    "A Shadow",
    "A Puddle",
    "A Crack",
    "A Sign",
    "A Window",
    "A Bench",
    "A Tree Root",
    "A Fence Post",
    "A Lock",
    "A Fire Hydrant",
    "A Mailbox",
    "A Staircase",
  ],
};

const CATEGORIES: Category[] = ["Color", "Shape", "Theme", "Object"];

function dayOfYear(): number {
  const now = new Date();
  return Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
}

export function getTodayTopics(): { category: Category; label: string }[] {
  const day = dayOfYear();
  return CATEGORIES.map((cat, i) => {
    const list = TOPICS[cat];
    return { category: cat, label: list[(day + i * 7) % list.length] };
  });
}

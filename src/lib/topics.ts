export type Category = "Color" | "Shape" | "Theme" | "Object";

export const TOPICS: Record<Category, string[]> = {
  Color: [
    "Coral Red #E8402A",
    "Royal Blue #1D4ED8",
    "Golden Yellow #EAB308",
    "Forest Green #16A34A",
    "Burnt Orange #EA580C",
    "Lavender Purple #A855F7",
    "Warm Cream #FEF3C7",
    "Hot Pink #EC4899",
    "Chocolate Brown #92400E",
    "Goldenrod #CA8A04",
    "Steel Gray #6B7280",
    "Teal #0D9488",
  ],
  Shape: [
    "A circle",
    "A triangle",
    "A grid of rectangles",
    "A spiral",
    "An arch or arc",
    "Parallel lines",
    "A diamond",
    "A starburst or star",
    "A wave or curve",
    "Concentric rings",
  ],
  Theme: [
    "Sunbeam cutting through an alley",
    "Dew on a spider's web",
    "Chalk art on a sidewalk",
    "Rust patterns on metal",
    "A plant growing from concrete",
    "A vintage barbershop pole",
    "Your reflection in a shop window",
    "A shadow at midday",
    "Weathered wood grain",
    "Street art detail up close",
    "A faded painted wall",
  ],
  Object: [
    "A payphone or call box",
    "A bicycle locked to a post",
    "Tree roots cracking pavement",
    "A faded hopscotch grid",
    "A convex traffic mirror",
    "A street art sticker",
    "A worn stone doorstep",
    "A water meter cover",
    "Coins in a fountain",
    "A newspaper box",
    "A construction sawhorse",
    "A broken umbrella left behind",
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

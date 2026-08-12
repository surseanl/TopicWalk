export type Category = "Color" | "Shape" | "Theme" | "Object";

export const TOPICS: Record<Category, string[]> = {
  Color: [
    "A red fire hydrant",
    "A blue front door",
    "A yellow taxi cab",
    "A green traffic light",
    "An orange construction cone",
    "A purple flower",
    "A white picket fence",
    "A pink awning",
    "A brown park bench",
    "A gold door knocker",
    "A silver car hood",
    "Turquoise window shutters",
  ],
  Shape: [
    "A manhole cover",
    "A yield sign from below",
    "A brick wall pattern",
    "A winding stair railing",
    "A spiral fire escape",
    "A painted crosswalk",
    "A tiled floor pattern",
    "Iron fence spikes",
    "A storm drain grate",
    "A bridge arch reflection",
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

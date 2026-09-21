import { NextResponse } from "next/server";

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let h = seed;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function POST(req: Request) {
  const { lat, lng, date } = (await req.json()) as {
    lat: number;
    lng: number;
    date: string;
  };

  const radius = 20000; // 20 km
  const query = `
[out:json][timeout:20];
(
  node["leisure"~"^(park|nature_reserve)$"]["name"]["access"!="private"](around:${radius},${lat},${lng});
  way["leisure"~"^(park|nature_reserve)$"]["name"]["access"!="private"](around:${radius},${lat},${lng});
  node["tourism"~"^(museum|attraction|viewpoint)$"]["name"]["access"!="private"](around:${radius},${lat},${lng});
  way["tourism"~"^(museum|attraction|viewpoint)$"]["name"]["access"!="private"](around:${radius},${lat},${lng});
  node["amenity"="library"]["name"]["access"!="private"](around:${radius},${lat},${lng});
  way["amenity"="library"]["name"]["access"!="private"](around:${radius},${lat},${lng});
  node["historic"]["name"]["access"!="private"]["historic"!="battlefield"](around:${radius},${lat},${lng});
  way["historic"]["name"]["access"!="private"]["historic"!="battlefield"](around:${radius},${lat},${lng});
);
out center 150;
  `.trim();

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
      signal: AbortSignal.timeout(22000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Overpass API unavailable" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { elements: OverpassElement[] };
    const elements = data.elements ?? [];

    const candidates = elements
      .map((e) => ({
        id: String(e.id),
        name: e.tags?.name ?? "",
        lat: e.lat ?? e.center?.lat ?? 0,
        lng: e.lon ?? e.center?.lon ?? 0,
        category:
          e.tags?.leisure ??
          e.tags?.tourism ??
          e.tags?.amenity ??
          e.tags?.historic ??
          "place",
      }))
      .filter(
        (c) =>
          c.lat !== 0 &&
          c.lng !== 0 &&
          c.name.length >= 3 &&
          c.name.length <= 60,
      );

    const seed = djb2(
      `${date}_${Math.round(lat * 10)}_${Math.round(lng * 10)}`,
    );
    const shuffled = seededShuffle(candidates, seed);

    // Pick 3 that are at least 500 m apart
    const picked: typeof candidates = [];
    for (const c of shuffled) {
      if (picked.length >= 3) break;
      const tooClose = picked.some((p) => {
        const dx = (p.lat - c.lat) * 111000;
        const dy = (p.lng - c.lng) * 111000 * Math.cos((p.lat * Math.PI) / 180);
        return Math.sqrt(dx * dx + dy * dy) < 500;
      });
      if (!tooClose) picked.push(c);
    }

    return NextResponse.json({ mascots: picked });
  } catch (err) {
    console.error("solo-places error:", err);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 },
    );
  }
}

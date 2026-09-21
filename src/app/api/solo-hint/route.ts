import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { env } from "~/env";

export async function POST(req: Request) {
  const { placeName, placeCategory, lat, lng, tileNumber } =
    (await req.json()) as {
      placeName: string;
      placeCategory: string;
      lat: number;
      lng: number;
      tileNumber: number;
    };

  const vagueness =
    tileNumber <= 2
      ? "very vague — only a broad feeling, atmosphere, or general environment type (e.g. 'busy', 'peaceful', 'outdoors'). Never mention what kind of place it is."
      : tileNumber <= 4
        ? "moderately vague — describe one general physical characteristic like materials, scale, or surroundings, without revealing the type of place"
        : tileNumber <= 6
          ? "somewhat specific — describe a notable visual feature or landmark nearby, without naming the place"
          : "quite specific — describe a distinctive detail that strongly narrows the location, like a specific architectural feature, signage style, or unique element";

  const prompt = `You are writing clues for a GPS treasure hunt game called TopicWalk. A mascot is hidden at a real public location. The player must walk around and earn tiles to reveal clues.

Tile ${tileNumber} of 9 just unlocked. The hidden location is: "${placeName}" (type: ${placeCategory}).

Write ONE clue about this location. Be ${vagueness}. Never name the place directly. No street names, addresses, or coordinates. Reply with ONLY the clue — 1 sentence, under 25 words.`;

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });

    const hint =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

    // Fetch Mapillary street-level photo for tile 4+
    let photoUrl: string | null = null;
    if (tileNumber >= 4 && env.MAPILLARY_ACCESS_TOKEN) {
      try {
        const mapRes = await fetch(
          `https://graph.mapillary.com/images?access_token=${env.MAPILLARY_ACCESS_TOKEN}&fields=id,thumb_1024_url&closeto=${lng},${lat}&limit=5`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (mapRes.ok) {
          const mapData = (await mapRes.json()) as {
            data: Array<{ thumb_1024_url: string }>;
          };
          const idx = (tileNumber - 4) % Math.max(1, mapData.data.length);
          photoUrl = mapData.data[idx]?.thumb_1024_url ?? null;
        }
      } catch {
        // photos are optional
      }
    }

    return NextResponse.json({ hint, photoUrl });
  } catch (err) {
    console.error("solo-hint error:", err);
    return NextResponse.json(
      { error: "Hint generation failed" },
      { status: 500 },
    );
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { env } from "~/env";

export async function POST(req: Request) {
  try {
    const { photoUrl, tileNumber, totalTiles } = (await req.json()) as {
      photoUrl: string;
      tileNumber: number;
      totalTiles: number;
    };

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Could not fetch image" },
        { status: 400 },
      );
    }
    const imgBuffer = await imgRes.arrayBuffer();
    const imgBase64 = Buffer.from(imgBuffer).toString("base64");
    const rawMime = imgRes.headers.get("content-type") ?? "image/jpeg";
    const mimeType = rawMime.split(";")[0].trim() as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    const vagueness =
      tileNumber <= 3
        ? "very vague — mention only a broad quality like light, general environment type, or surface texture"
        : tileNumber <= 6
          ? "moderately specific — describe one visible detail without naming the exact place"
          : "quite specific — describe a distinctive feature that strongly narrows the location";

    const prompt = `You are writing clues for a GPS hide-and-seek game called Mascot Hunt. A player hid a mascot outdoors and photographed something prominent there as a clue. Seekers must walk to reveal 9 tiles covering this photo.

Tile ${tileNumber} of ${totalTiles} just flipped open. Write ONE clue about this location. Be ${vagueness}. Never mention street names, business names, or coordinates. Reply with only the clue — 1 sentence, under 20 words.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: imgBase64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const hint =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

    return NextResponse.json({ hint });
  } catch (err) {
    console.error("Mascot hint API error:", err);
    return NextResponse.json(
      { error: "Hint generation failed" },
      { status: 500 },
    );
  }
}

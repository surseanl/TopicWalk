import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { env } from "~/env";
import type { Category } from "~/lib/topics";

function buildPrompt(category: Category, label: string): string {
  switch (category) {
    case "Color": {
      const hexMatch = label.match(/#[0-9A-Fa-f]{6}/);
      const hex = hexMatch ? hexMatch[0] : "";
      const colorName = label.replace(/#[0-9A-Fa-f]{6}/, "").trim();
      return `Grade this photo for a color photography challenge. The target color is "${colorName}" (${hex}).

Identify the dominant color in the photo and score how closely it matches on a scale of 0-100:
- 90-100: Near-perfect match
- 70-89: Very close, minor hue or saturation difference
- 50-69: Same general color family
- 30-49: Loosely related color
- 0-29: Very different color

Respond with ONLY valid JSON, no markdown or code fences:
{"score": <number 0-100>, "dominantColor": "<name of the actual dominant color you see>", "feedback": "<1-2 sentences>"}`;
    }
    case "Shape":
      return `Grade this photo for a shape photography challenge. The target shape is "${label}".

Score how clearly and prominently that shape appears in the photo on a scale of 0-100:
- 90-100: The shape is the unmistakable dominant subject
- 70-89: The shape is clearly present and prominent
- 50-69: The shape is visible but not the main focus
- 30-49: The shape is barely discernible
- 0-29: The target shape is not present

Respond with ONLY valid JSON, no markdown or code fences:
{"score": <number 0-100>, "feedback": "<1-2 sentences>"}`;
    case "Object":
      return `Grade this photo for an object photography challenge. The target object is "${label}".

Determine whether the object is clearly visible and identifiable in the photo. Be strict.

Respond with ONLY valid JSON, no markdown or code fences:
{"found": <true or false>, "confidence": <number 0-100>, "feedback": "<1-2 sentences>"}`;
    case "Theme":
      return `Grade this photo for a theme photography challenge. The theme is "${label}".

Score how well this photo captures and expresses that theme on a scale of 0-100:
- 90-100: Masterfully captures the theme — atmosphere, mood, and subject all align
- 70-89: Clearly relates to the theme with good execution
- 50-69: Related to the theme but loosely
- 30-49: Only tangentially connected
- 0-29: Does not relate to the theme

Respond with ONLY valid JSON, no markdown or code fences:
{"score": <number 0-100>, "feedback": "<1-2 sentences>"}`;
  }
}

export async function POST(req: Request) {
  try {
    const { imageUrl, category, label } = (await req.json()) as {
      imageUrl: string;
      category: Category;
      label: string;
    };

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const prompt = buildPrompt(category, label);

    const imgRes = await fetch(imageUrl);
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

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
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

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "{}";

    // Strip markdown fences if the model wrapped the JSON
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return NextResponse.json(JSON.parse(cleaned));
  } catch (err) {
    console.error("Grade API error:", err);
    return NextResponse.json({ error: "Grading failed" }, { status: 500 });
  }
}

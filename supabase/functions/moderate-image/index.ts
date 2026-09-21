import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "",
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { imageUrl } = (await req.json()) as { imageUrl: string };

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: "Is this image appropriate for all ages in a family-friendly walking game app? Reply with only one word: SAFE or UNSAFE.",
            },
          ],
        },
      ],
    });

    const reply =
      message.content[0]?.type === "text"
        ? message.content[0].text.trim().toUpperCase()
        : "SAFE";

    return new Response(JSON.stringify({ safe: !reply.startsWith("UNSAFE") }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("moderate-image error:", err);
    // Default to safe on error so a transient API failure doesn't block all uploads
    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

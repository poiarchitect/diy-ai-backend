import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const {
      type,
      prompt,
      image_url,
      question,
      size = "1024x1024"
    } = body || {};

    if (!type) {
      return res.status(400).json({ error: "Missing 'type' in request body" });
    }

    // --- Chat ---
    if (type === "chat") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });

      return res.status(200).json({
        reply: response.choices?.[0]?.message?.content || null
      });
    }

    // --- Image Generation ---
    if (type === "image") {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size,
        n: 1
      });

      const first = response.data?.[0];
      const url = first?.url || null;
      const b64 = first?.b64_json
        ? `data:image/png;base64,${first.b64_json}`
        : null;

      if (!url && !b64) {
        return res.status(400).json({
          error: "OpenAI did not return an image",
          raw: response
        });
      }

      return res.status(200).json({
        response_image_url: url || b64
      });
    }

    // --- Vision ---
    if (type === "vision") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: question },
              { type: "image_url", image_url: { url: image_url } }
            ]
          }
        ]
      });

      return res.status(200).json({
        vision_reply: response.choices?.[0]?.message?.content || null
      });
    }

    // --- Fallback ---
    return res.status(400).json({ error: `Unknown type: ${type}` });
  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong",
      details: err.message
    });
  }
}


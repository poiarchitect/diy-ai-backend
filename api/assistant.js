import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type, prompt, image_url, question, size = "1024x1024" } = body || {};
    if (!type) return res.status(400).json({ error: "Missing 'type' in request body" });

    // --- Chat ---
    if (type === "chat") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });
      return res.status(200).json({ reply: response.choices?.[0]?.message?.content || null });
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
      if (!first) return res.status(400).json({ error: "OpenAI image generation failed", raw: response });
      const url = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : null);
      return res.status(200).json({ response_image_url: url });
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
      return res.status(200).json({ vision_reply: response.choices?.[0]?.message?.content || null });
    }

    // --- Image Edit ---
    if (type === "image_edit") {
      try {
        const imgRes = await fetch(image_url);
        if (!imgRes.ok) {
          return res.status(400).json({ error: "Could not fetch image from provided URL" });
        }

        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

        // Convert to PNG, resize max 1024x1024, compress under 4MB
        const pngBuffer = await sharp(imgBuffer)
          .resize({ width: 1024, height: 1024, fit: "inside" })
          .png({ quality: 90 })
          .toBuffer();

        if (pngBuffer.length > 4 * 1024 * 1024) {
          return res.status(400).json({ error: "Image too large after conversion (>4MB). Please upload a smaller image." });
        }

        // Build form-data
        const form = new FormData();
        const file = new File([pngBuffer], "upload.png", { type: "image/png" });
        form.append("image", file);
        form.append("prompt", prompt || "");
        form.append("size", size || "1024x1024");
        form.append("n", "1");

        const r = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          body: form
        });

        const data = await r.json();
        const first = data?.data?.[0];
        if (!r.ok || !first) {
          return res.status(r.status || 400).json({ error: data?.error?.message || "OpenAI image edit failed", raw: data });
        }

        const url = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : null);
        return res.status(200).json({ response_image_url: url });
      } catch (err) {
        return res.status(500).json({ error: "Image edit failed", details: err.message });
      }
    }

    // --- Fallback ---
    return res.status(400).json({ error: `Unknown type: ${type}` });

  } catch (err) {
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}

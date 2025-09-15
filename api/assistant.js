import FormData from "form-data";

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
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await r.json();
      return res.status(200).json({
        reply: data?.choices?.[0]?.message?.content || null
      });
    }

    // --- Image (generation) ---
    if (type === "image") {
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size,
          n: 1
        })
      });

      const data = await r.json();
      const first = data?.data?.[0];

      if (!r.ok || !first) {
        return res.status(r.status || 400).json({
          error: data?.error?.message || "OpenAI image generation failed"
        });
      }

      const url = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : null);
      if (!url) {
        return res.status(400).json({ error: "OpenAI did not return usable image content" });
      }

      return res.status(200).json({ response_image_url: url });
    }

    // --- Vision ---
    if (type === "vision") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: question },
              { type: "image_url", image_url: { url: image_url } }
            ]
          }]
        })
      });

      const data = await r.json();
      return res.status(200).json({
        vision_reply: data?.choices?.[0]?.message?.content || null
      });
    }

    // --- Image Edit ---
    if (type === "image_edit") {
      try {
        // Pre-check file size
        const headRes = await fetch(image_url, { method: "HEAD" });
        const sizeBytes = headRes.headers.get("content-length");
        if (sizeBytes && Number(sizeBytes) > 4 * 1024 * 1024) {
          return res.status(400).json({ error: "Image too large (>4MB). Please upload a smaller one." });
        }

        // Fetch the image and get buffer
        const imgRes = await fetch(image_url);
        if (!imgRes.ok) {
          return res.status(400).json({ error: "Could not fetch image from provided URL" });
        }
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

        // Build form-data payload
        const form = new FormData();
        form.append("image", imgBuffer, { filename: "upload.png", contentType: "image/png" });
        form.append("prompt", prompt || "");
        form.append("size", size || "1024x1024");
        form.append("n", "1");

        const r = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...form.getHeaders()
          },
          body: form
        });

        const data = await r.json();
        const first = data?.data?.[0];

        if (!r.ok || !first) {
          return res.status(r.status || 400).json({
            error: data?.error?.message || "OpenAI image edit failed",
            raw: data
          });
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


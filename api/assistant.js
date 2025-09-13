export default async function handler(req, res) {
  // --- Handle CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET → return sample schema for Bubble initialization
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      type: "schema",
      response_text: "Sample chat text",
      response_vision_text: "Sample vision description",
      response_image_url: "https://fake-cdn.openai.com/sample.png",
      response_b64: "iVBORw0KGgoAAAANSUhEUgAA..."
    });
  }

  // Only POST does real work
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, input, options = {}, image_url } = req.body || {};

    if (!type || !input) {
      return res.status(400).json({ error: "Missing 'type' or 'input'" });
    }

    let response = {};

    // 1) CHAT
    if (type === "chat") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are DIY AI Assistant. Only provide safe DIY guidance. Never give instructions for electricity, plumbing, or gas. Always recommend licensed professionals for those."
            },
            { role: "user", content: input }
          ],
          max_tokens: options.max_tokens || 500
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      response.response_text = data.choices?.[0]?.message?.content || null;
    }

    // 2) IMAGE GENERATION
    else if (type === "image") {
      const ALLOWED_SIZES = new Set(["1024x1024", "1024x1536", "1536x1024"]);
      const rawSize = typeof options.size === "string" ? options.size.trim() : "";
      const size = ALLOWED_SIZES.has(rawSize) ? rawSize : "1024x1024";

      const quality = options.quality === "hd" ? "hd" : "standard";
      const n = typeof options.n === "number" && options.n >= 1 && options.n <= 4 ? Math.floor(options.n) : 1;

      const imgPayload = {
        model: "gpt-image-1",
        prompt: input,
        size,
        quality,
        n
      };

      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(imgPayload)
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      response.response_image_url = data.data?.[0]?.url || null;
      response.response_b64 = data.data?.[0]?.b64_json || null;
    }

    // 3) VISION
    else if (type === "vision") {
      if (!image_url) {
        return res.status(400).json({ error: "Missing 'image_url' for vision type" });
      }

      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are DIY AI Assistant with vision. Only describe and guide safe DIY tasks. Do NOT provide electrical, plumbing, or gas instructions."
            },
            {
              role: "user",
              content: [
                { type: "text", text: input },
                { type: "image_url", image_url: { url: image_url } }
              ]
            }
          ]
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      response.response_vision_text = data.choices?.[0]?.message?.content || null;
    }

    // Unsupported type
    else {
      return res.status(400).json({ error: `Unsupported type: ${type}` });
    }

    return res.status(200).json({ success: true, type, ...response });
  } catch (err) {
    console.error("Error in /api/assistant:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}

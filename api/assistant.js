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

    // --- Image (Bubble-ready: URL if possible, fallback to base64) ---
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
      const url = data?.data?.[0]?.url || null;
      const b64 = data?.data?.[0]?.b64_json
        ? `data:image/png;base64,${data.data[0].b64_json}`
        : null;

      if (!r.ok || (!url && !b64)) {
        return res.status(r.status).json({
          error: data?.error?.message || "OpenAI did not return an image",
          raw: data
        });
      }

      return res.status(200).json({
        response_image_url: url || b64
      });
    }

    // --- Vision (describe an uploaded image) ---
    if (type === "vision") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
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
        })
      });

      const data = await r.json();
      return res.status(200).json({
        vision_reply: data?.choices?.[0]?.message?.content || null
      });
    }

    // --- Image Edit (reimagine an uploaded image with prompt) ---
    if (type === "image_edit") {
      const imgRes = await fetch(image_url);
      if (!imgRes.ok) {
        return res.status(400).json({ error: "Could not fetch uploaded image" });
      }
      const imgBuffer = await imgRes.arrayBuffer();
      const blob = new Blob([imgBuffer]);

      const form = new FormData();
      form.append("image", blob, "upload.png");
      form.append("prompt", prompt);
      form.append("size", size);
      form.append("n", "1");

      const r = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: form
      });

      const data = await r.json();
      const url = data?.data?.[0]?.url || null;
      const b64 = data?.data?.[0]?.b64_json
        ? `data:image/png;base64,${data.data[0].b64_json}`
        : null;

      if (!r.ok || (!url && !b64)) {
        return res.status(r.status).json({
          error: data?.error?.message || "OpenAI did not return an edited image",
          raw: data
        });
      }

      return res.status(200).json({
        response_image_url: url || b64
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

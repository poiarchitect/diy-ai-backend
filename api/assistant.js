export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type, prompt, image_url, question, size = "1024x1024" } = body || {};

    if (!type) return res.status(400).json({ error: "Missing 'type' in request body" });

    if (type === "chat") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await r.json();
      return res.status(200).json({ reply: data?.choices?.[0]?.message?.content || null });
    }

    if (type === "image") {
      const r = await fetch("https://api.openai.com/v1/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size
        })
      });
      const data = await r.json();
      return res.status(200).json({
        response_image_url: data?.data?.[0]?.url || null,
        response_b64: data?.data?.[0]?.b64_json || null
      });
    }

    if (type === "vision") {
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
      return res.status(200).json({ vision_reply: data?.choices?.[0]?.message?.content || null });
    }

    return res.status(400).json({ error: `Unknown type: ${type}` });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}

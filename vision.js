export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, image_url } = req.body || {};

    if (!prompt || !image_url) {
      return res.status(400).json({ error: "Missing 'prompt' or 'image_url' in request" });
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
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image_url } }
            ]
          }
        ]
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    const output = data?.choices?.[0]?.message?.content || null;

    return res.status(200).json({ output });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong in /api/vision" });
  }
}


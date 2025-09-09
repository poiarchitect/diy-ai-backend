export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024"
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    return res.status(200).json({
      image_url: data?.data?.[0]?.url || null
    });
  } catch (err) {
    console.error("Image API error:", err);
    return res.status(500).json({ error: "Something went wrong in /api/image" });
  }
}


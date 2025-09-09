export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      prompt,
      size = "1024x1024",      // allowed: 256x256, 512x512, 1024x1024, 1024x1536, 1536x1024, or "auto"
      quality = "high",         // "high" or "standard"
      background = "white"      // "white" or "transparent"
    } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request" });
    }

    const r = await fetch("https://api.openai.com/v1/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
        quality,
        background
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    const b64 = data?.data?.[0]?.b64_json || null;
    const output_url = data?.data?.[0]?.url || null; // sometimes null for gpt-image-1
    const data_url = b64 ? `data:image/png;base64,${b64}` : null;

    return res.status(200).json({
      image: { data_url, b64, output_url },
      usage: data?.usage || null
    });
  } catch {
    return res.status(500).json({ error: "Something went wrong in /api/image" });
  }
}


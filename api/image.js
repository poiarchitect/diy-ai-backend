export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, size = "1024x1024" } = req.body || {};
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
        size
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    const url = data?.data?.[0]?.url || null;
    const b64 = data?.data?.[0]?.b64_json || null;
    const data_url = b64 ? `data:image/png;base64,${b64}` : null;

    if (!url && !data_url) {
      return res.status(502).json({ error: "No image returned" });
    }

    return res.status(200).json({ image_url: url, data_url, usage: data?.usage || null });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong in /api/image" });
  }
}


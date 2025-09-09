export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      prompt,
      size = "1024x1024",
      quality = "high",
      background = "white"
    } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request" 
});
    }

    const r = await fetch("https://api.openai.com/v1/images/generations", 
{
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

    if (!r.ok) {
      return res.status(r.status).json({ error: data });
    }

    const image_url = data?.data?.[0]?.url || null;
    const b64 = data?.data?.[0]?.b64_json || null;
    const data_url = b64 ? `data:image/png;base64,${b64}` : null;

    return res.status(200).json({
      image_url,
      fallback_data_url: data_url,
      usage: data?.usage || null
    });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong in 
/api/image" });
  }
}


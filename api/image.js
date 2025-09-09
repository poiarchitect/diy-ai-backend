export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      prompt,
      size = "1024x1024",        // allowed: 1024x1024, 1024x1536, 
1536x1024, or "auto"
      quality = "high",           // "high" | "standard"
      background = "white"        // "white" | "transparent"
    } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request" 
});
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
        // NOTE: gpt-image-1 does not support response_format:"url".
        // We return a data: URL ourselves below.
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data });
    }

    const b64 = data?.data?.[0]?.b64_json || null;
    if (!b64) {
      return res.status(502).json({ error: "No image returned from OpenAI" 
});
    }

    const dataUrl = `data:image/png;base64,${b64}`;

    return res.status(200).json({
      image_url: dataUrl,      // <— usable directly in <img src="...">
      b64,                     // optional: raw base64 if you need it
      usage: data?.usage || null
    });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong in 
/api/image" });
  }
}


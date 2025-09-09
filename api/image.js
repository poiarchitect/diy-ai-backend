export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse JSON body safely
    const { prompt, size } = await req.json().catch(() => ({}));
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing 'prompt' string in request" });
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: size || "1024x1024",
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      return res.status(response.status).json({ error: errTxt });
    }

    const data = await response.json();
    return res.status(200).json({ image_url: data.data[0].url });
  } catch (err) {
    console.error("Image API error:", err);
    return res.status(500).json({ error: "Something went wrong in /api/image" });
  }
}


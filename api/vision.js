export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, image_url } = req.body;

    if (!prompt || !image_url) {
      return res.status(400).json({ error: "Missing prompt or image_url" });
    }

    // Example response - replace with actual AI call later
    return res.status(200).json({
      reply: `You asked me to analyze: "${prompt}". The image URL was: ${image_url}`
    });

  } catch (error) {
    console.error("Vision API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}


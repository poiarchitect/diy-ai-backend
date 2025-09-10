import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, size = "1024x1024", quality = "high", background = 
"white" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
      quality,
      background,
    });

    const imageUrl = response.data[0].url;
    res.status(200).json({ image_url: imageUrl, raw: response });
  } catch (error) {
    console.error("Image generation failed:", error);
    res.status(500).json({ error: error.message || "Image generation 
failed" });
  }
}


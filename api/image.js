import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { prompt, size } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: size || "512x512",
    });

    return res.status(200).json({
      url: response.data[0].url,
    });
  } catch (error) {
    console.error("Image generation failed:", error);
    return res.status(500).json({ error: error.message });
  }
}



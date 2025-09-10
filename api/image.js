import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, size } = JSON.parse(req.body);

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: size || "1024x1024"
    });

    // Always return the first image URL
    const imageUrl = response.data[0].url;

    res.status(200).json({
      success: true,
      prompt,
      size: size || "1024x1024",
      url: imageUrl
    });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message });
  }
}



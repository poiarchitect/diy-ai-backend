import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, size } = JSON.parse(req.body);

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size || "1024x1024", // fallback to 1024x1024
    });

    // Return the first image URL clearly
    res.status(200).json({ url: result.data[0].url });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message });
  }
}



import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, size } = req.body;

    // fallback to 1024x1024 if size is not provided
    const imageSize = size || "1024x1024";

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: imageSize,
    });

    res.status(200).json({
      url: response.data[0].url,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: error.message });
  }
}

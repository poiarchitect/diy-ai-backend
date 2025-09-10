import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, size } = req.body; // no JSON.parse

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size || "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({
        success: false,
        error: "No image URL returned from OpenAI",
      });
    }

    res.status(200).json({
      success: true,
      prompt,
      size: size || "1024x1024",
      url: imageUrl,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Unknown error",
    });
  }
}



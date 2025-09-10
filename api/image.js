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

    // Default size if none provided
    const finalSize = size || "1024x1024";

    // Call OpenAI Images API
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: finalSize,
    });

    // Return clean JSON with image URL
    return res.status(200).json({
      success: true,
      prompt,
      size: finalSize,
      url: response.data[0].url,
    });

  } catch (error) {
    console.error("Image generation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Image generation failed",
    });
  }
}



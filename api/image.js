import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const body = req.body;

    // Default prompt & size
    const prompt = body.prompt || "A default test image";
    const size = body.size || "1024x1024";

    // Call OpenAI image generation
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
    });

    // Extract URL safely
    const imageUrl = response.data?.[0]?.url;

    // Respond as proper JSON
    return res.status(200).json({
      success: true,
      prompt,
      size,
      url: imageUrl,
    });

  } catch (error) {
    console.error("Image generation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
    });
  }
}



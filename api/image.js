import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, size } = JSON.parse(req.body);

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size || "1024x1024",
      response_format: "b64_json",  // ask OpenAI for base64
    });

    const imageBase64 = response.data[0].b64_json;

    if (!imageBase64) {
      return res.status(500).json({
        success: false,
        error: "No image data returned from OpenAI",
      });
    }

    // Convert base64 → data URL so Bubble can use it
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    res.status(200).json({
      success: true,
      prompt,
      size: size || "1024x1024",
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
    });
  }
}


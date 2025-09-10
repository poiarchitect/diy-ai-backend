import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, size } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size || "1024x1024",
    });

    let imageUrl = null;

    // Prefer URL if available
    if (response.data && response.data[0]?.url) {
      imageUrl = response.data[0].url;
    }
    // Otherwise fallback to base64
    else if (response.data && response.data[0]?.b64_json) {
      imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
    }

    if (!imageUrl) {
      return res.status(500).json({
        success: false,
        error: "No image URL or base64 returned from OpenAI",
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
      error: err?.message || String(err) || "Unknown error",
    });
  }
}



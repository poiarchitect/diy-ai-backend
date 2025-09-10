import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, size } = JSON.parse(req.body);

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size || "1024x1024",
    });

    const imageBase64 = response.data[0].b64_json;
    if (!imageBase64) {
      return res.status(500).json({
        success: false,
        error: "No base64 image returned from OpenAI",
      });
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;

    return res.status(200).json({
      success: true,
      url: imageUrl,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Unknown error",
    });
  }
}



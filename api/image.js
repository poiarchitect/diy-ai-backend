import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not 
allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { prompt, size } = body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: "Missing 
prompt" });
    }

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size || "1024x1024",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ success: false, error: "No image URL 
returned" });
    }

    return res.status(200).json({
      success: true,
      url: imageUrl,
      prompt,
      size: size || "1024x1024",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || String(err),
    });
  }
}


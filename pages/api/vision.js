import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, image_url } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!prompt || !image_url) {
      return res.status(400).json({
        success: false,
        error: "Missing 'prompt' or 'image_url' in request",
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image_url } },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      description: response.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err?.message || "Unknown error",
    });
  }
}



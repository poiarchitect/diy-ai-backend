import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, image_url } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "Describe this image" },
            { type: "image_url", image_url: { url: image_url } },
          ],
        },
      ],
      max_tokens: 300,
    });

    res.status(200).json({
      success: true,
      description: response.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || JSON.stringify(err),
    });
  }
}



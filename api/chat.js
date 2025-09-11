import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : 
req.body;
    const { prompt, imageUrl } = body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    let response;

    if (imageUrl) {
      // Vision input (text + image)
      response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      });
    } else {
      // Text-only input
      response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
    }

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  runtime: "edge",
};


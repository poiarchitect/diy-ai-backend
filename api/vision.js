import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing image URL or file" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "Describe this image" },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    });

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Vision API Error:", error);
    res.status(500).json({ error: "Vision request failed" });
  }
}

export const config = {
  runtime: "nodejs18.x",
};



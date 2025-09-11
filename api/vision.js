import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : 
req.body;
    const { prompt, image_url } = body;

    if (!image_url) {
      return res.status(400).json({ error: "Missing image URL" });
    }

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI that analyzes images." 
},
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "Describe this image" },
            { type: "image_url", image_url: { url: image_url } },
          ],
        },
      ],
    });

    res.status(200).json({
      reply: result.choices[0].message.content,
    });
  } catch (err) {
    console.error("Vision API error:", err);
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  runtime: "nodejs",
};


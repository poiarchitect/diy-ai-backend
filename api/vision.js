import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { prompt, image_url } = req.body;

    if (!prompt || !image_url) {
      return res.status(400).json({ error: "Missing prompt or image_url" 
});
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // supports text + images
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
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Vision API error:", error);
    res.status(500).json({ error: error.message });
  }
}



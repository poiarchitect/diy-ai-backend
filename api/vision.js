import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, image_url } = req.body;

    if (!prompt || !image_url) {
      return res.status(400).json({ error: "Missing prompt or image_url" 
});
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // vision-capable model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image_url } }
          ]
        }
      ],
    });

    res.status(200).json({ output: response.choices[0].message.content });
  } catch (error) {
    console.error("Vision API error:", error);
    res.status(500).json({ error: error.message });
  }
}



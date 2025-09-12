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
    const prompt = body.prompt || "Describe this image.";
    const imageUrl = body.image_url;

    if (!imageUrl) {
      return res.status(400).json({ error: "Missing image_url" });
    }

    const completion = await client.chat.completions.create({
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

    res.status(200).json({ reply: completion.choices[0].message.content 
});
  } catch (err) {
    console.error("Vision API error:", err);
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  runtime: "nodejs",
};


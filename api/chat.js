import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request" 
});
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.status(200).json({
      success: true,
      reply: response.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err?.message || "Unknown error",
    });
  }
}

export const config = {
  runtime: "edge",
  regions: ["all"],
};



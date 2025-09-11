import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const prompt = body.prompt || "Hello!";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.status(200).json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Chat API error:", err);
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  runtime: "nodejs",
};


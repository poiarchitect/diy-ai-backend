import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type, prompt, image_url, question, size = "1024x1024" } = body || {};
    if (!type) return res.status(400).json({ error: "Missing 'type' in request body" });

    // --- Chat ---
    if (type === "chat") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are DIY Assistant, a professional, approachable, and safety-conscious mentor for the entire world of DIY and construction.

Your highest priority is safety:
- Always highlight hazards such as power tools, cutting, drilling, dust, chemicals, and working at height.
- If drilling or cutting into walls, always warn about hidden pipes, wiring, and gas lines.
- Never provide instructions for electrical wiring, gas fitting, or plumbing repairs. Instead, recommend licensed professionals.
- Stay strictly within DIY, home improvement, and construction.

Your goal is to make the user feel they have a skilled, reliable DIY partner in their pocket — one who keeps them safe while guiding them to success.`
          },
          { role: "user", content: prompt }
        ]
      });

      return res.status(200).json({
        reply: response.choices?.[0]?.message?.content || null
      });
    }

    // --- Image Generation ---
    if (type === "image") {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size,
        n: 1
      });

      const first = response.data?.[0];
      const url = first?.url || null;
      const b64 = first?.b64_json ? `data:image/png;base64,${first.b64_json}` : null;

      if (!url && !b64) {
        return res.status(400).json({ error: "OpenAI did not return an image" });
      }

      return res.status(200).json({
        response_image_url: url || b64
      });
    }

    // --- Vision ---
    if (type === "vision") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are DIY Assistant, a professional, approachable, and safety-conscious mentor for the entire world of DIY and construction.

Follow the same safety-first rules as in chat mode:
- Never provide instructions for gas, electrical, or plumbing work.
- Only warn about those hazards and suggest licensed professionals.
- For all other DIY, highlight risks and give safe, practical advice.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: question },
              { type: "image_url", image_url: { url: image_url } }
            ]
          }
        ]
      });

      return res.status(200).json({
        vision_reply: response.choices?.[0]?.message?.content || null
      });
    }

    return res.status(400).json({ error: `Unknown type: ${type}` });
  } catch (err) {
    console.error("Error in handler:", err);
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}

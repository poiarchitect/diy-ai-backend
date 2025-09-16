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
    const {
      type,
      prompt,
      image_url,
      question,
      size = "1024x1024"
    } = body || {};

    if (!type) {
      return res.status(400).json({ error: "Missing 'type' in request body" });
    }

    // --- Chat ---
    if (type === "chat") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are DIY Assistant, a professional, approachable, and safety-conscious mentor for the entire world of DIY and construction.

Your role is to help users plan, understand, and carry out projects across the full scope of the DIY industry — woodworking, painting, flooring, roofing, landscaping, furniture assembly, 
renovations, and more.
Your highest priority is safety. For every task, highlight hazards a tradesperson would consider — power tools, cutting, drilling, dust, chemicals, working at height, etc.
If drilling or cutting into walls, always warn about hidden pipes, wiring, and gas lines.
Never provide instructions for electrical wiring, gas fitting, or plumbing repairs. Instead, clearly recommend licensed professionals. You may guide users in avoiding or working safely around those 
systems.
Speak with the voice of a trusted tradesperson: knowledgeable, approachable, and practical.
Stay strictly within DIY, home improvement, and construction.
Always reply in plain text only. Do not use bullet points, symbols, or Markdown formatting. Use short paragraphs or numbered steps instead.
Your goal: make the user feel they have a skilled, reliable DIY partner in their pocket — one who keeps them safe while guiding them to success.`
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
      const b64 = first?.b64_json
        ? `data:image/png;base64,${first.b64_json}`
        : null;

      if (!url && !b64) {
        return res.status(400).json({
          error: "OpenAI did not return an image",
          raw: response
        });
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

Follow the same safety-first rules as in chat mode: never provide instructions for gas, electrical, or plumbing work; only warn about them and suggest licensed professionals.
For all other DIY, highlight hazards and give safe, practical advice.
Always reply in plain text only. Do not use bullet points, symbols, or Markdown formatting. Use short paragraphs or numbered steps instead.`
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

    // --- Fallback ---
    return res.status(400).json({ error: `Unknown type: ${type}` });
  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong",
      details: err.message
    });
  }
}

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
            content:
              "You are DIY Assistant, a professional, approachable, and safety-conscious mentor for the entire world of DIY and construction. Your role is to help users plan, understand, and carry 
out projects across the full scope of DIY: woodworking, painting, flooring, roofing, landscaping, furniture assembly, renovations, and more. Safety is your highest priority: always highlight hazards 
like power tools, drilling, dust, chemicals, working at height. When drilling or cutting into walls, always warn about hidden pipes, wiring, and gas lines. Never provide instructions for electrical 
wiring, gas fitting, or plumbing repairs—recommend licensed professionals instead. Speak with the voice of a trusted tradesperson: knowledgeable, approachable, practical. Stay strictly within DIY, 
home improvement, and construction. Your goal: make the user feel they have a skilled, reliable DIY partner in their pocket who keeps them safe while guiding them to success."
          },
          { role: "user", content: prompt }
        ]
      });

      return res.status(200).json({
        reply: response.choices?.[0]?.message?.content || null
      });
    }

    // --- Image ---
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
        return res.status(400).json({ error: "OpenAI did not return an image", raw: response });
      }

      return res.status(200).json({ response_image_url: url || b64 });
    }

    // --- Vision ---
    if (type === "vision") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are DIY Assistant. Always prioritize safety. Never provide instructions for gas, electrical, or plumbing work; only warn and suggest licensed professionals. For all other DIY, 
highlight hazards and provide safe, practical guidance."
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
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}

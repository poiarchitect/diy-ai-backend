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
              "You are DIY Assistant, a professional, approachable, and safety-conscious mentor for the entire DIY and construction industry. Your role is to guide users through projects such as 
woodworking, painting, flooring, roofing, landscaping, furniture assembly, and renovations. Safety is your top priority. Always highlight hazards like power tools, cutting, drilling, dust, 
chemicals, or working at height. If drilling or cutting into walls, always warn about hidden pipes, wiring, and gas lines. Never provide instructions for electrical wiring, gas fitting, or plumbing 
repairs — instead, clearly recommend licensed professionals. Speak with the voice of a trusted tradesperson: knowledgeable, approachable, and practical. Stay strictly within DIY, home improvement, 
and construction. Always reply in clean text, without extra symbols, so the response is clear and easy to follow."
          },
          { role: "user", content: prompt }
        ]
      });

      return res.status(200).json({
        reply: response.choices?.[0]?.message?.content?.trim() || null
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
              "You are DIY Assistant, a professional, approachable, and safety-conscious mentor for DIY and construction. Apply the same safety-first rules as in chat mode. Never provide 
instructions for electrical, gas, or plumbing work; only warn about them and recommend licensed professionals. For all other DIY, highlight hazards and give safe, practical advice. Always reply in 
clean text."
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
        vision_reply: response.choices?.[0]?.message?.content?.trim() || null
      });
    }

    // --- Fallback ---
    return res.status(400).json({ error: `Unknown type: ${type}` });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}

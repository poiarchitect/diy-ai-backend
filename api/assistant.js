import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Handler invoked"); // Debug
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type, prompt, image_url, question, size = "1024x1024" } = body || {};

    console.log("Request type:", type); // Debug

    if (!type) {
      return res.status(400).json({ error: "Missing 'type' in request body" });
    }

    // --- Chat ---
    if (type === "chat") {
      console.log("Running chat with prompt:", prompt); // Debug
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are DIY Assistant. A professional, approachable, safety-conscious mentor for the entire DIY and construction world. Always prioritize safety, never guide 
electrical/gas/plumbing work, but warn users of risks. Speak like a trusted tradesperson."
          },
          { role: "user", content: prompt }
        ]
      });

      const reply = response.choices?.[0]?.message?.content || null;
      console.log("Chat reply:", reply); // Debug
      return res.status(200).json({ reply });
    }

    // --- Image Generation ---
    if (type === "image") {
      console.log("Running image generation with prompt:", prompt); // Debug
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
        console.error("Image gen failed:", response); // Debug
        return res.status(400).json({ error: "OpenAI did not return an image", raw: response });
      }

      console.log("Image URL:", url || "[base64 returned]"); // Debug
      return res.status(200).json({ response_image_url: url || b64 });
    }

    // --- Vision ---
    if (type === "vision") {
      console.log("Running vision with question:", question, "and image_url:", image_url); // Debug
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are DIY Assistant. Always prioritize safety. Never provide electrical, gas, or plumbing instructions. Warn users of risks while guiding safe DIY tasks."
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

      const vision_reply = response.choices?.[0]?.message?.content || null;
      console.log("Vision reply:", vision_reply); // Debug
      return res.status(200).json({ vision_reply });
    }

    // --- Fallback ---
    return res.status(400).json({ error: `Unknown type: ${type}` });
  } catch (err) {
    console.error("Handler error:", err); // Debug
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}

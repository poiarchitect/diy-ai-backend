export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image_url, question } = req.body || {};

    if (!image_url || !question) {
      return res.status(400).json({ error: "Missing image_url or question" });
    }

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",   // supports image + text
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: question },
              { type: "input_image", image_url }
            ]
          }
        ]
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    return res.status(200).json({
      answer: data.output_text || "No answer",
      usage: data.usage || null
    });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong in /api/vision" });
  }
}


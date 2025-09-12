export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image_url, question } = req.body || {};

    if (!image_url || !question) {
      return res.status(400).json({ error: "Missing 'image_url' or 'question' in request" });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: question },
              { type: "image_url", image_url: { url: image_url } }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "No response"
    });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong in /api/vision" });
  }
}


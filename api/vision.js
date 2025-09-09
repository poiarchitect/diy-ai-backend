export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image_url, image_b64, question = "Please analyze this image." 
} = req.body || {};
    if (!image_url && !image_b64) {
      return res.status(400).json({ error: "Provide 'image_url' or 
'image_b64'" });
    }
    const url = image_url || `data:image/png;base64,${image_b64}`;

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
            role: "system",
            content:
              "You are the DIY AI Assistant. Stay within DIY scope. Do NOT 
provide instructions for electrical, gas, or plumbing work. Emphasize 
safety and advise licensed professionals when risk or regulations apply."
          },
          {
            role: "user",
            content: [
              { type: "text", text: question },
              { type: "image_url", image_url: { url } }
            ]
          }
        ]
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    const reply = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply });
  } catch {
    return res.status(500).json({ error: "Something went wrong in 
/api/vision" });
  }
}


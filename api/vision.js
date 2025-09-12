export default async function handler(req, res) {
  try {
    const body = await req.json();
    const imageUrl = body.image_url;

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: body.prompt || "Analyze this image" },
          ...(imageUrl ? [{ type: "image_url", image_url: { url: imageUrl } }] : [])
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages
    });

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}


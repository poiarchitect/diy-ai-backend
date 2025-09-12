export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, image_prompt, image_url, question } = req.body || {};

    let response;

    // Case 1: Image generation
    if (image_prompt) {
      const r = await fetch("https://api.openai.com/v1/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: image_prompt,
          size: "1024x1024"
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      const output_url = data?.data?.[0]?.url || null;
      const b64 = data?.data?.[0]?.b64_json || null;
      const data_url = b64 ? `data:image/png;base64,${b64}` : null;

      response = { type: "image", output_url, data_url };
    }

    // Case 2: Vision (analyze an image with a question)
    else if (image_url && question) {
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
          ]
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      response = { type: "vision", text: data.choices[0].message.content };
    }

    // Case 3: Default = text chat
    else if (message) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: message }]
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      response = { type: "chat", text: data.choices[0].message.content };
    }

    else {
      return res.status(400).json({ error: "Invalid request body" });
    }

    return res.status(200).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong in /api/assistant" });
  }
}


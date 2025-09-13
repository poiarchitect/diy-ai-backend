export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, input, options = {}, image_url } = req.body || {};

    if (!type || !input) {
      return res.status(400).json({ error: "Missing 'type' or 'input'" });
    }

    let response = {};

    // 1) CHAT
    if (type === "chat") {
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
                "You are DIY AI Assistant. Only provide safe DIY guidance. Never give instructions for electricity, plumbing, or gas. Always recommend licensed professionals for those."
            },
            { role: "user", content: input }
          ],
          max_tokens: options.max_tokens || 500
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      response.response_text = data.choices?.[0]?.message?.content || null;
    }

    // 2) IMAGE GENERATION
    else if (type === "image") {
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: input,
          size: options.size || "1024x1024",
          quality: options.quality || "standard",
          n: options.n || 1,
          response_format: "url"
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      response.response_image_url = data.data?.[0]?.url || null;
    }

    // 3) VISION
    else if (type === "vision") {
      if (!image_url) {
        return res.status(400).json({ error: "Missing 'image_url' for vision type" });
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
              role: "system",
              content:
                "You are DIY AI Assistant with vision. Only describe and guide safe DIY tasks. Do NOT provide electrical, plumbing, or gas instructions."
            },
            {
              role: "user",
              content: [
                { type: "text", text: input },
                { type: "image_url", image_url: { url: image_url } }
              ]
            }
          ]
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data });

      response.response_vision_text = data.choices?.[0]?.message?.content || null;
    }

    // 4) AUDIO
    else if (type === "audio") {
      if (options.mode === "transcribe") {
        const form = new FormData();
        form.append("file", input); // input = file stream or buffer
        form.append("model", "gpt-4o-mini-transcribe");

        const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          body: form
        });

        const data = await r.json();
        if (!r.ok) return res.status(r.status).json({ error: data });

        response.response_text = data.text || null;
      }

      else if (options.mode === "speak") {
        const r = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini-tts",
            voice: options.voice || "alloy",
            input
          })
        });

        const buffer = Buffer.from(await r.arrayBuffer());
        const audio_b64 = buffer.toString("base64");

        response.response_audio = `data:audio/mp3;base64,${audio_b64}`;
      }

      else {
        return res.status(400).json({ error: "Missing or invalid 'mode' for audio type" });
      }
    }

    else {
      return res.status(400).json({ error: `Unsupported type: ${type}` });
    }

    return res.status(200).json({ success: true, type, ...response });
  } catch (err) {
    console.error("Error in /api/assistant:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}

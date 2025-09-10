import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Support both a string body and an already-parsed JSON body
    let body = req.body;
    if (typeof body === "string" || body instanceof String) {
      body = JSON.parse(body);
    } else if (!body) {
      body = {};
    }

    const { prompt, size } = body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, error: 'Missing "prompt" (string)' });
    }

    const resp = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: typeof size === "string" && size ? size : "1024x1024",
      response_format: "url",          // ask for a URL, not base64
    });

    const imageUrl = resp?.data?.[0]?.url;
    if (!imageUrl) {
      return res.status(500).json({ success: false, error: "No image URL returned from OpenAI" });
    }

    return res.status(200).json({
      success: true,
      url: imageUrl,
      prompt,
      size: size || "1024x1024",
    });
  } catch (err) {
    // Always return a *string* message
    const message =
      (err && err.message) ||
      (() => { try { return JSON.stringify(err); } catch { return String(err); } })();

    return res.status(500).json({ success: false, error: message });
  }
}


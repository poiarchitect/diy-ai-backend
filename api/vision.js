import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : 
(req.body || {});
    let { prompt, image_url, image_base64, image_data_url } = body;

    // sensible default
    prompt = (prompt && String(prompt).trim()) || "Describe this image.";

    // Normalize inputs
    if (!image_url && image_data_url) image_url = image_data_url; // allow 
either name
    if (image_url && image_url.startsWith("//")) image_url = "https:" + 
image_url; // Bubble temp URLs

    let imagePart;
    if (image_base64) {
      // Accepts raw base64 or full data URL
      const dataUrl = image_base64.startsWith("data:")
        ? image_base64
        : `data:image/png;base64,${image_base64}`;
      imagePart = { type: "input_image", image_url: { url: dataUrl } };
    } else if (image_url) {
      imagePart = { type: "input_image", image_url: { url: image_url } };
    } else {
      return res.status(400).json({ error: "Provide image_url or 
image_base64" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: [{ type: "text", text: prompt }, 
imagePart] }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ description: reply });
  } catch (err) {
    console.error("vision error:", err?.response?.data || err);
    return res.status(500).json({
      error: err?.response?.data?.error?.message || err.message || 
"Internal error"
    });
  }
}

export const config = { runtime: "nodejs" };


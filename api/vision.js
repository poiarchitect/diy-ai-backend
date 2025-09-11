import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, image_url } = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    // Prepend https:// if Bubble gives //
    let fixedUrl = image_url;
    if (fixedUrl && fixedUrl.startsWith("//")) {
      fixedUrl = "https:" + fixedUrl;
    }

    const result = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "Describe this image" },
            { type: "image_url", image_url: { url: fixedUrl } }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      description: result.choices[0].message.content
    });
  } catch (error) {
    console.error("Vision API error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}


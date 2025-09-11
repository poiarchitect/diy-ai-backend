import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  try {
    const { prompt, image_url } = req.body;

    // Ensure the image URL is valid and starts with https://
    let fixedUrl = image_url;
    if (fixedUrl && fixedUrl.startsWith("//")) {
      fixedUrl = "https:" + fixedUrl;
    }
    if (fixedUrl && !fixedUrl.startsWith("http")) {
      fixedUrl = "https://" + fixedUrl;
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

    res.json({
      success: true,
      description: result.choices[0].message.content
    });
  } catch (error) {
    console.error("Vision endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;



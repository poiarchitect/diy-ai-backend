import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  try {
    const { prompt, image_url } = req.body;

    if (!prompt || !image_url) {
      return res.status(400).json({ success: false, error: "Missing prompt 
or image_url" });
    }

    // Fix Bubble relative URLs
    let finalUrl = image_url;
    if (finalUrl.startsWith("//")) {
      finalUrl = "https:" + finalUrl;
    }

    const result = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: finalUrl } }
          ]
        }
      ]
    });

    const description = result.choices?.[0]?.message?.content || "";

    res.json({ success: true, description });
  } catch (error) {
    console.error("Vision endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;


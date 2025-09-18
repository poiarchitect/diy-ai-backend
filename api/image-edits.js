import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, image_url, size = "1024x1024" } = req.body;

    if (!prompt || !image_url) {
      return res.status(400).json({ error: "Missing prompt or image_url" });
    }

    // Fetch the image from URL
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) {
      return res.status(400).json({ error: "Could not fetch image" });
    }

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Convert to PNG and resize to OpenAI spec
    const pngBuffer = await sharp(imgBuffer)
      .resize({ width: 1024, height: 1024, fit: "inside" })
      .png()
      .toBuffer();

    if (pngBuffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large after conversion (>4MB)" });
    }

    // Call OpenAI Image Edit endpoint
    const response = await openai.images.edits({
      model: "gpt-image-1",
      prompt,
      image: [
        {
          name: "image.png",
          buffer: pngBuffer,
        },
      ],
      size,
    });

    const editedImage = response.data[0].b64_json;

    res.status(200).json({ image: editedImage });
  } catch (error) {
    console.error("Error editing image:", error);
    res.status(500).json({ error: error.message });
  }
}


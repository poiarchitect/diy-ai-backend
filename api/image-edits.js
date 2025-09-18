import sharp from "sharp";
import FormData from "form-data";

/**
 * POST /api/image-edit
 * Body: { prompt: string, image_url: string, size?: "1024x1024"|"512x512"|"256x256" }
 * Returns: { edited_image_url: string }
 *
 * Notes:
 * - Accepts a public image URL (Bubble’s Picture Uploader URL works).
 * - Converts to PNG RGBA, max 1024x1024, under 4MB to satisfy OpenAI edits API.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const {
      prompt,
      image_url,
      size = "1024x1024"
    } = body;

    if (!prompt || !image_url) {
      return res.status(400).json({ error: "Missing 'prompt' or 'image_url' in request body" });
    }

    // Optional HEAD to short-circuit very large sources (some servers don’t return content-length; that’s fine)
    try {
      const head = await fetch(image_url, { method: "HEAD" });
      const len = head.headers.get("content-length");
      if (len && Number(len) > 20 * 1024 * 1024) { // hard cap pre-download
        return res.status(400).json({ error: "Source image too large (>20MB). Please upload a smaller image." });
      }
    } catch (_) {
      // ignore HEAD errors; we’ll handle on GET
    }

    // Fetch original
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) {
      return res.status(400).json({ error: "Could not fetch image from provided URL" });
    }
    const srcBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Normalize → PNG RGBA, <=1024px box, keep under 4MB if possible
    const pngBuffer = await sharp(srcBuffer)
      .rotate() // respect EXIF orientation
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .toColorspace("srgb")
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();

    if (pngBuffer.length > 4 * 1024 * 1024) {
      // try one more pass at slightly higher compression
      const tighter = await sharp(pngBuffer).png({ compressionLevel: 9 }).toBuffer();
      if (tighter.length > 4 * 1024 * 1024) {
        return res.status(400).json({ error: "Image too large after conversion (>4MB). Please upload a smaller image." });
      }
    }

    // Build multipart form for OpenAI /images/edits
    const form = new FormData();
    form.append("image", pngBuffer, { filename: "upload.png", contentType: "image/png" });
    form.append("prompt", prompt);
    form.append("size", size);
    form.append("n", "1");

    const r = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await r.json();

    const first = data?.data?.[0];
    const url = first?.url || null;
    const b64 = first?.b64_json ? `data:image/png;base64,${first.b64_json}` : null;

    if (!r.ok || (!url && !b64)) {
      return res.status(r.status || 400).json({
        error: data?.error?.message || "OpenAI did not return an edited image",
        raw: data
      });
    }

    return res.status(200).json({ edited_image_url: url || b64 });
  } catch (err) {
    return res.status(500).json({ error: "Image edit failed", details: err.message });
  }
}


import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // disable default body parser for file uploads
  },
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper: parse multipart form
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let prompt, size, imageBuffer;

    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // Case 1: file upload
      const { fields, files } = await parseForm(req);
      prompt = fields.prompt?.toString() || "Edit this image";
      size = fields.size?.toString() || "1024x1024";

      if (!files.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      imageBuffer = fs.readFileSync(files.file.filepath);
    } else {
      // Case 2: JSON with image_url
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(JSON.parse(data || "{}")));
        req.on("error", reject);
      });

      prompt = body.prompt || "Edit this image";
      size = body.size || "1024x1024";

      if (!body.image_url) {
        return res.status(400).json({ error: "No image_url provided" });
      }

      const response = await fetch(body.image_url);
      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch remote image" });
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    // Call OpenAI edits
    const response = await client.images.edits({
      model: "gpt-image-1",
      prompt,
      image: [imageBuffer],
      size,
    });

    res.status(200).json({ url: response.data[0].url });
  } catch (error) {
    console.error("Image edit error:", error);
    res.status(500).json({ error: error.message });
  }
}

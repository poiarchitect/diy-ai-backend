import formidable from "formidable";
import fs from "fs";
import OpenAI, { toFile } from "openai";

export const config = { api: { bodyParser: false } };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { fields, files } = await parseForm(req);

    // 🔎 Debug log
    console.log("FIELDS:", fields);
    console.log("FILES:", files);

    if (!files.file) {
      return res.status(400).json({ debug: { fields, files }, error: "No file uploaded" });
    }

    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;
    const filename = uploaded.originalFilename || "upload.png";
    const mimetype =
      uploaded.mimetype && uploaded.mimetype !== "application/octet-stream"
        ? uploaded.mimetype
        : "image/png";

    const filePart = await toFile(fs.createReadStream(uploaded.filepath), filename, { type: mimetype });

    const response = await client.images.edits({
      model: "gpt-image-1",
      prompt: fields.prompt?.toString() || "Edit this image",
      size: fields.size?.toString() || "1024x1024",
      image: filePart,
    });

    res.status(200).json({ url: response.data[0].url });
  } catch (error) {
    console.error("Image edit error:", error);
    res.status(500).json({ error: error.message });
  }
}

import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";
import { toFile } from "openai/uploads";

export const config = {
  api: { bodyParser: false }, // required for multipart/form-data
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Promisified Formidable
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      return resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    const prompt = fields?.prompt?.toString() || "Edit this image";
    const size = fields?.size?.toString() || "1024x1024";

    // Formidable v3 can return arrays
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile?.filepath) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // IMPORTANT: Give OpenAI a *named* file with extension + mimetype
    const filename =
      uploadedFile.originalFilename?.toString() || "upload.png";
    const fileStream = fs.createReadStream(uploadedFile.filepath);

    // Wrap with toFile so the SDK sets filename and content-type properly
    const imageFile = await toFile(fileStream, filename);

    // Use the correct Images Edit method (singular: edit)
    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: imageFile,
      size,
    });

    const first = response?.data?.[0];
    if (!first) {
      return res.status(500).json({ error: "OpenAI returned no image" });
    }

    // Prefer hosted URL; if only base64 is returned, expose a data URL
    const url = first.url || (first.b64_json ? `data:image/png;base64,${first.b64_json}` : null);
    if (!url) {
      return res.status(500).json({ error: "No usable image content from OpenAI" });
    }

    return res.status(200).json({ url });
  } catch (error) {
    console.error("Image edit error:", error);
    return res.status(500).json({ error: error.message });
  }
}

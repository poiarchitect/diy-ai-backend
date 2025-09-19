import formidable from "formidable";
import fs from "fs";
import OpenAI, { toFile } from "openai";

export const config = { api: { bodyParser: false } };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });

// robust mime guess to avoid "application/octet-stream"
function guessMime(name = "") {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { fields, files } = await parseForm(req);

    const prompt = fields.prompt?.toString() || "Edit this image";
    const size = fields.size?.toString() || "1024x1024";

    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploaded?.filepath) return res.status(400).json({ error: "No file uploaded" });

    const filename = uploaded.originalFilename || "upload.png";
    const mimetype =
      uploaded.mimetype && uploaded.mimetype !== "application/octet-stream"
        ? uploaded.mimetype
        : guessMime(filename);

    const filePart = await toFile(fs.createReadStream(uploaded.filepath), filename, { type: mimetype });

    // ✅ correct endpoint for edits + force URL response
    const response = await client.images.edit({
      model: "gpt-image-1",
      image: filePart,
      prompt,
      size,
      response_format: "url",
    });

    res.status(200).json({ url: response.data[0].url });
  } catch (error) {
    console.error("Image edit error:", error);
    res.status(500).json({ error: error.message });
  }
}

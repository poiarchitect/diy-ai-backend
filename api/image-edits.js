import formidable from "formidable";
import fs from "fs";
import OpenAI, { toFile } from "openai";

export const config = { api: { bodyParser: false } };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) =>
      err ? reject(err) : resolve({ fields, files })
    );
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    const prompt = fields.prompt?.toString() || "Edit this image";
    const size = fields.size?.toString() || "1024x1024";

    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploaded?.filepath) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = uploaded.originalFilename || "upload.png";
    const mimetype =
      uploaded.mimetype && uploaded.mimetype !== "application/octet-stream"
        ? uploaded.mimetype
        : "image/png";

    const filePart = await toFile(
      fs.createReadStream(uploaded.filepath),
      filename,
      { type: mimetype }
    );

    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: [filePart],
      size,
    });

    const first = response.data?.[0];
    const url = first?.url || null;
    const b64 = first?.b64_json ? `data:image/png;base64,${first.b64_json}` : null;

    if (!url && !b64) {
      return res.status(400).json({ error: "OpenAI did not return an image" });
    }

    return res.status(200).json({ response_image_url: url || b64 });
  } catch (error) {
    console.error("Image edit error:", error);
    res.status(500).json({ error: error.message });
  }
}

import formidable from "formidable";
import fs from "fs";
import path from "path";
import mime from "mime-types";   // ✅ add mime-types
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { fields, files } = await parseForm(req);

    const prompt = fields.prompt?.toString() || "Edit this image";
    const size = fields.size?.toString() || "1024x1024";

    const uploadedFile = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    if (!uploadedFile?.filepath) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Detect real MIME type based on extension
    const ext = path.extname(uploadedFile.originalFilename || "").toLowerCase();
    const mimeType =
      mime.lookup(ext) || "image/png"; // fallback to png if unknown

    const imageStream = fs.createReadStream(uploadedFile.filepath);

    // ✅ Send both stream + mimetype
    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      size,
      image: [
        {
          name: uploadedFile.originalFilename || "upload.png",
          buffer: imageStream,
          type: mimeType,
        },
      ],
    });

    res.status(200).json({ url: response.data[0].url });
  } catch (error) {
    console.error("Image edit error:", error);
    res.status(500).json({ error: error.message });
  }
}


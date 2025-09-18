import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // formidable handles file parsing
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Promisify formidable parsing
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

    if (!files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Always use .filepath for formidable v3
    const imageStream = fs.createReadStream(files.file.filepath);

    const response = await client.images.edits({
      model: "gpt-image-1",
      image: imageStream,
      prompt,
      size,
    });

    res.status(200).json({ url: response.data[0].url });
  } catch (error) {
    console.error("Image edit error:", error);
    res.status(500).json({ error: error.message });
  }
}


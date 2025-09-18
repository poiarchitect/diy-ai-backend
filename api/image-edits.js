import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // disable default body parsing so formidable works
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Wrap formidable in a promise
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
    // Parse multipart form (prompt + file)
    const { fields, files } = await parseForm(req);

    const prompt = fields.prompt?.toString() || "Edit this image";
    const size = fields.size?.toString() || "1024x1024";

    if (!files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Create stream from uploaded file
    const filepath = files.file.filepath;
    const imageStream = fs.createReadStream(filepath);

    // Call OpenAI Image Edits
    const response = await client.images.edits({
      model: "gpt-image-1",
      image: [imageStream],
      prompt,
      size,
    });

    // Return the edited image URL
    res.status(200).json({ url: response.data[0].url });
  } catch (error) {
    console.error("Image edit error:", error);
    res.status(500).json({ error: error.message });
  }
}


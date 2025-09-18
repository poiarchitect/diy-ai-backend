import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // required for formidable
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// helper: parse multipart form-data
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

    // read uploaded file into buffer
    const imageBuffer = fs.readFileSync(files.file.filepath);

    // call OpenAI edits API
    const response = await client.images.edits({
      model: "gpt-image-1",
      image: [imageBuffer],
      prompt,
      size,
    });

    return res.status(200).json({ url: response.data[0].url });
  } catch (error) {
    console.error("Image edit error:", error);
    return res.status(500).json({ error: error.message });
  }
}



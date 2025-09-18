import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // disable default body parser, we’re handling form-data
  },
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse multipart form-data
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error parsing form data" });
      }

      const prompt = fields.prompt;
      const size = fields.size || "1024x1024";

      if (!files.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const imageStream = fs.createReadStream(files.file.filepath);

      const response = await client.images.edits({
        model: "gpt-image-1",
        image: imageStream,
        prompt,
        size,
      });

      const imageBase64 = response.data[0].b64_json;
      res.status(200).json({ image: imageBase64 });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}


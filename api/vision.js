// api/vision.js
export const config = { api: { bodyParser: false } };

import busboy from "busboy";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST 
only" });

  const bb = busboy({ headers: req.headers });

  let question = "Describe the image for DIY context.";
  let fileChunks = [];
  let fileMime = "image/jpeg";

  await new Promise((resolve, reject) => {
    bb.on("file", (name, file, info) => {
      fileMime = info.mimeType || "image/jpeg";
      file.on("data", d => fileChunks.push(d));
    });
    bb.on("field", (name, val) => {
      if (name === "question") question = val.trim();
    });
    bb.on("close", resolve);
    bb.on("error", reject);
    req.pipe(bb);
  });

  const buffer = Buffer.concat(fileChunks);
  const b64 = buffer.toString("base64");

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a safety-first DIY coach." },
      {
        role: "user",
        content: [
          { type: "text", text: question },
          { type: "input_image", image_data: { b64, mime_type: fileMime } 
}
        ]
      }
    ],
    max_tokens: 400
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const json = await r.json();
  return res.status(r.ok ? 200 : 400).json(json);
}


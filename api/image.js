const ALLOWED_SIZES = new Set(["1024x1024", "1024x1536", "1536x1024", 
"auto"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse JSON body robustly
  let body = {};
  try {
    if (req.body && typeof req.body === "object") {
      body = req.body;
    } else {
      const raw = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
      body = raw ? JSON.parse(raw) : {};
    }
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const prompt = (body.prompt || "").trim();
  let size = (body.size || "1024x1024").trim();
  if (!ALLOWED_SIZES.has(size)) size = "1024x1024";

  if (!prompt) {
    return res.status(400).json({ error: "Missing 'prompt' in body" });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", 
{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "(no body)");
      return res.status(r.status).json({ error: "OpenAI error", status: 
r.status, body: text });
    }

    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Image API error:", err);
    return res.status(500).json({ error: "Server error in /api/image" });
  }
}


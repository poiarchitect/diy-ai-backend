export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    // Quick validation
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Call OpenAI Images API
    const response = await 
fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "512x512"
      }),
    });

    const data = await response.json();

    // Pass raw response back
    return res.status(200).json(data);

  } catch (err) {
    console.error("Image API error:", err);
    return res.status(500).json({ error: "Something went wrong in 
/api/image" });
  }
}


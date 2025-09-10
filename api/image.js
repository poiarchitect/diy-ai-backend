import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { prompt, size } = JSON.parse(req.body);

    console.log("Incoming request body:", req.body);

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size || "1024x1024",
    });

    console.log("Raw OpenAI response:", JSON.stringify(response, null, 
2));

    const imageBase64 = response.data?.[0]?.b64_json;
    const imageUrl = response.data?.[0]?.url;

    console.log("Extracted base64:", imageBase64 ? "present" : "missing");
    console.log("Extracted url:", imageUrl || "none");

    if (!imageBase64 && !imageUrl) {
      return res.status(500).json({
        success: false,
        error: "No image data returned from OpenAI",
        raw: response.data,
      });
    }

    res.status(200).json({
      success: true,
      url: imageUrl || `data:image/png;base64,${imageBase64}`,
    });
  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Unknown error",
    });
  }
}



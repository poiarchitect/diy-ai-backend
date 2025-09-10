import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, size = "1024x1024", quality = "high", background = 
"white" } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 
});
    }

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
      quality,
      background,
    });

    const imageUrl = response.data[0].url;
    return NextResponse.json({ image_url: imageUrl, raw: response });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: error.message || "Image generation failed" },
      { status: 500 }
    );
  }
}


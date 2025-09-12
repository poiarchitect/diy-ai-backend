export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { prompt, image_url } = await req.json();

    if (!prompt || !image_url) {
      return new Response(
        JSON.stringify({ error: "Both 'prompt' and 'image_url' are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        reply: data?.choices?.[0]?.message?.content || "No response",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


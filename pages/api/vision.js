export const config = {
  runtime: "edge",
  regions: ["all"],
};

export default async function handler(req) {
  try {
    const { prompt, image_url } = await req.json();

    // Call OpenAI or return mock for testing
    const reply = `You asked me to analyze: "${prompt}". The image URL was: ${image_url}`;

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


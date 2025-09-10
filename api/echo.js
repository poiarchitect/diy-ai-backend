export default async function handler(req, res) {
  try {
    res.status(200).json({
      message: "Echo response",
      body: req.body,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}



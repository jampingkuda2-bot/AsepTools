const { getTiktokData } = require("../lib/tiktokApi");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { url } = req.body || {};
    const data = await getTiktokData(url);
    res.status(200).json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

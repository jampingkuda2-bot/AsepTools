const { handleUpload } = require("@vercel/blob/client");
const { getSessionFromReq } = require("../lib/auth");

module.exports = async (req, res) => {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: "Harus login dulu buat upload." });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/*", "video/*"],
        addRandomSuffix: true,
        maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
        tokenPayload: JSON.stringify({ uid: session.uid }),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log("Upload selesai:", blob.url);
      },
    });
    res.status(200).json(jsonResponse);
  } catch (err) {
    console.error("upload-token error:", err);
    res.status(400).json({ error: err.message || "Gagal menyiapkan upload." });
  }
};

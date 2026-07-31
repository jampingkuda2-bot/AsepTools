const fs = require("fs");
const path = require("path");
const { getTiktokData, safeFilename } = require("../lib/tiktokApi");
const { downloadToFile, convertToMp3, makeTempDir } = require("../lib/media");

// Batasi maksimal durasi function (detik). Hobby plan Vercel maks 300s (mesti di-set juga di vercel.json).
module.exports.config = { maxDuration: 60 };

module.exports = async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).json({ ok: false, error: "url wajib diisi" });

  try {
    const data = await getTiktokData(url);

    // MP4: langsung redirect ke link video HD tikwm, tanpa proxy.
    // Ini yang bikin ringan & cepat di serverless (tidak makan waktu/limit function).
    if (format !== "mp3") {
      return res.redirect(302, data.videoHdUrl || data.videoUrl);
    }

    // MP3: harus di-convert dulu, jadi tetap proses lewat function ini.
    const tempDir = makeTempDir();
    try {
      const videoPath = path.join(tempDir, "video.mp4");
      await downloadToFile(data.videoHdUrl || data.videoUrl, videoPath);

      const mp3Path = path.join(tempDir, "audio.mp3");
      await convertToMp3(videoPath, mp3Path);

      const filename = safeFilename(data.title, "mp3");
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const stream = fs.createReadStream(mp3Path);
      stream.pipe(res);
      stream.on("close", () => {
        fs.rm(tempDir, { recursive: true, force: true }, () => {});
      });
    } catch (err) {
      fs.rm(tempDir, { recursive: true, force: true }, () => {});
      throw err;
    }
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

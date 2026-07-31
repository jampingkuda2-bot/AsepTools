const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath(ffmpegPath);

/** Download file dari URL ke path lokal (streaming, hemat memori) */
async function downloadToFile(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: 30000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  await new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
    response.data.on("error", reject);
  });
  return destPath;
}

/** Convert file video -> mp3 pakai ffmpeg */
function convertToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(192)
      .format("mp3")
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .save(outputPath);
  });
}

/** Bikin folder temp unik untuk satu proses download */
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tiktokdl-"));
}

module.exports = { downloadToFile, convertToMp3, makeTempDir };

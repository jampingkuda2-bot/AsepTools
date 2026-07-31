const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");
const ffmpegPath = require("ffmpeg-static");

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

/** Convert file video -> mp3 pakai ffmpeg (spawn langsung, tanpa fluent-ffmpeg) */
function convertToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i", inputPath,
      "-vn",
      "-acodec", "libmp3lame",
      "-b:a", "192k",
      outputPath,
    ];
    const proc = spawn(ffmpegPath, args);

    let stderr = "";
    proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`ffmpeg gagal (exit code ${code}): ${stderr.slice(-500)}`));
    });
  });
}

/** Bikin folder temp unik untuk satu proses download */
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tiktokdl-"));
}

module.exports = { downloadToFile, convertToMp3, makeTempDir };

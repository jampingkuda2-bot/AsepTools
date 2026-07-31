const axios = require("axios");

/**
 * Ambil data video TikTok (tanpa watermark) lewat API publik tikwm.com
 * @param {string} url - link video TikTok
 * @returns {Promise<{
 *   title: string,
 *   author: string,
 *   cover: string,
 *   videoUrl: string,
 *   videoHdUrl: string,
 *   musicUrl: string,
 *   durationSec: number
 * }>}
 */
async function getTiktokData(url) {
  if (!url || !/tiktok\.com/i.test(url)) {
    throw new Error("URL tidak valid. Pastikan link dari tiktok.com");
  }

  const { data } = await axios.post(
    "https://www.tikwm.com/api/",
    new URLSearchParams({ url, hd: "1" }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    }
  );

  if (!data || data.code !== 0 || !data.data) {
    throw new Error(
      "Gagal ambil data video. Pastikan link benar, video publik, dan bukan private/dihapus."
    );
  }

  const d = data.data;
  const toAbsolute = (u) => {
    if (!u) return u;
    return u.startsWith("http") ? u : `https://www.tikwm.com${u}`;
  };

  return {
    title: d.title || "tiktok_video",
    author: d.author?.unique_id || d.author?.nickname || "unknown",
    cover: toAbsolute(d.cover || d.origin_cover || ""),
    videoUrl: toAbsolute(d.play),
    videoHdUrl: toAbsolute(d.hdplay || d.play),
    musicUrl: toAbsolute(d.music),
    durationSec: d.duration || 0,
  };
}

/** Bikin nama file aman dari judul video */
function safeFilename(title, ext) {
  const clean = (title || "tiktok")
    .replace(/[\\/:*?"<>|]+/g, "")
    .trim()
    .slice(0, 60) || "tiktok";
  return `${clean}.${ext}`;
}

module.exports = { getTiktokData, safeFilename };

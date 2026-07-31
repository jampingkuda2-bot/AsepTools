export function initTiktok() {
  const form = document.getElementById("ttForm");
  const urlInput = document.getElementById("ttUrlInput");
  const fetchBtn = document.getElementById("ttFetchBtn");
  const statusLine = document.getElementById("ttStatusLine");
  const preview = document.getElementById("ttPreview");
  const cover = document.getElementById("ttCover");
  const title = document.getElementById("ttTitle");
  const author = document.getElementById("ttAuthor");
  const duration = document.getElementById("ttDuration");
  const dlMp4 = document.getElementById("ttDlMp4");
  const dlMp3 = document.getElementById("ttDlMp3");

  function formatDuration(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function setStatus(text, kind) {
    statusLine.textContent = text;
    statusLine.className = "status-line" + (kind ? ` ${kind}` : "");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    fetchBtn.disabled = true;
    setStatus("MENGANALISIS LINK...");
    preview.hidden = true;

    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Gagal ambil data.");

      const data = json.data;
      cover.src = data.cover || "";
      title.textContent = data.title || "TikTok Video";
      author.textContent = `@${data.author}`;
      duration.textContent = formatDuration(data.durationSec || 0);

      dlMp4.href = `/api/download?url=${encodeURIComponent(url)}&format=mp4`;
      dlMp3.href = `/api/download?url=${encodeURIComponent(url)}&format=mp3`;

      preview.hidden = false;
      setStatus("SIAP — pilih format download di bawah", "ok");
    } catch (err) {
      setStatus(`ERROR — ${err.message}`, "error");
    } finally {
      fetchBtn.disabled = false;
    }
  });
}

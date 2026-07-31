export function initUpload() {
  const dropCard = document.getElementById("uDropCard");
  const fileInput = document.getElementById("uFileInput");
  const progressCard = document.getElementById("uProgressCard");
  const resultCard = document.getElementById("uResultCard");
  const ringFg = document.getElementById("uRingFg");
  const ringPercent = document.getElementById("uRingPercent");
  const progressLabel = document.getElementById("uProgressLabel");
  const linkOutput = document.getElementById("uLinkOutput");
  const copyBtn = document.getElementById("uCopyBtn");
  const resetBtn = document.getElementById("uResetBtn");
  const statusLine = document.getElementById("uStatusLine");

  const RING_CIRCUMFERENCE = 238.8;
  const MAX_BYTES = 500 * 1024 * 1024;

  function setStatus(text, isError) {
    statusLine.textContent = text || "";
    statusLine.className = "status-line" + (isError ? " error" : "");
  }

  function setRing(percent, label) {
    const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;
    ringFg.style.strokeDashoffset = offset;
    ringPercent.textContent = `${Math.round(percent)}%`;
    if (label) progressLabel.textContent = label;
  }

  function showOnly(el) {
    [dropCard, progressCard, resultCard].forEach((c) => { c.hidden = c !== el; });
  }

  dropCard.addEventListener("click", () => fileInput.click());
  dropCard.addEventListener("dragover", (e) => { e.preventDefault(); dropCard.classList.add("drag-over"); });
  dropCard.addEventListener("dragleave", () => dropCard.classList.remove("drag-over"));
  dropCard.addEventListener("drop", (e) => {
    e.preventDefault();
    dropCard.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });

  async function handleFile(file) {
    setStatus("");

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Cuma bisa upload foto atau video.", true);
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus(`File ini terlalu besar (maks 500MB).`, true);
      return;
    }

    showOnly(progressCard);
    setRing(0, "Menyiapkan upload...");

    try {
      const { upload } = await import("https://cdn.jsdelivr.net/npm/@vercel/blob@0.27.1/client/+esm");

      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload-token",
        contentType: file.type,
        onUploadProgress: ({ percentage }) => setRing(percentage, "Mengupload..."),
      });

      const viewUrl = `${location.origin}/v.html?u=${encodeURIComponent(blob.url)}&n=${encodeURIComponent(file.name)}&t=${encodeURIComponent(file.type)}`;
      linkOutput.value = viewUrl;
      showOnly(resultCard);
    } catch (err) {
      console.error(err);
      showOnly(dropCard);
      const msg = String((err && err.message) || "");
      if (/401|login/i.test(msg)) {
        setStatus("Sesi login kamu habis. Silakan masuk lagi.", true);
      } else {
        setStatus(`Upload gagal: ${msg || "kesalahan tak terduga"}`, true);
      }
    } finally {
      fileInput.value = "";
    }
  }

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(linkOutput.value);
      copyBtn.textContent = "Tersalin!";
      setTimeout(() => { copyBtn.textContent = "Salin"; }, 1500);
    } catch {
      linkOutput.select();
      document.execCommand("copy");
    }
  });

  resetBtn.addEventListener("click", () => { showOnly(dropCard); setStatus(""); });
}

export function initResize() {
  let currentFile = null;
  let bitmap = null;
  let resultUrl = null;
  let rMode = "percent";

  const dropCard = document.getElementById("rDropCard");
  const fileInput = document.getElementById("rFileInput");
  const optionsCard = document.getElementById("rOptionsCard");
  const fileName = document.getElementById("rFileName");
  const fileMeta = document.getElementById("rFileMeta");
  const clearFileBtn = document.getElementById("rClearFile");
  const segPill = document.getElementById("rSegPill");
  const segButtons = document.querySelectorAll("#rSegmented .seg-btn");
  const percentOptions = document.getElementById("rPercentOptions");
  const exactOptions = document.getElementById("rExactOptions");
  const percentRange = document.getElementById("rPercentRange");
  const percentPreview = document.getElementById("rPercentPreview");
  const widthInput = document.getElementById("rWidthInput");
  const heightInput = document.getElementById("rHeightInput");
  const lockRatio = document.getElementById("rLockRatio");
  const processBtn = document.getElementById("rProcessBtn");
  const resultCard = document.getElementById("rResultCard");
  const dimBefore = document.getElementById("rDimBefore");
  const dimAfter = document.getElementById("rDimAfter");
  const downloadBtn = document.getElementById("rDownloadBtn");
  const resetBtn = document.getElementById("rResetBtn");
  const statusLine = document.getElementById("rStatusLine");

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function setStatus(text, isError) {
    statusLine.textContent = text || "";
    statusLine.className = "status-line" + (isError ? " error" : "");
  }

  function showOnly(el) {
    [dropCard, optionsCard, resultCard].forEach((c) => { c.hidden = c !== el; });
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
    if (!file.type.startsWith("image/")) {
      setStatus("File ini bukan gambar.", true);
      return;
    }
    currentFile = file;
    setStatus("");
    try {
      bitmap = await createImageBitmap(file);
    } catch (err) {
      setStatus("Gagal baca gambar ini.", true);
      return;
    }

    fileName.textContent = file.name;
    fileMeta.textContent = `${bitmap.width}×${bitmap.height} · ${formatBytes(file.size)}`;
    widthInput.value = bitmap.width;
    heightInput.value = bitmap.height;
    updatePercentPreview();
    showOnly(optionsCard);
  }

  segButtons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      rMode = btn.dataset.rmode;
      segButtons.forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      segPill.style.transform = `translateX(${i * 100}%)`;
      percentOptions.hidden = rMode !== "percent";
      exactOptions.hidden = rMode !== "exact";
    });
  });

  function updatePercentPreview() {
    if (!bitmap) return;
    const pct = Number(percentRange.value);
    const w = Math.round(bitmap.width * (pct / 100));
    const h = Math.round(bitmap.height * (pct / 100));
    percentPreview.textContent = `${pct}% — ${w}×${h}px`;
  }

  percentRange.addEventListener("input", () => {
    percentRange.style.setProperty("--fill", `${percentRange.value}%`);
    updatePercentPreview();
  });

  widthInput.addEventListener("input", () => {
    if (!bitmap || !lockRatio.checked) return;
    const ratio = bitmap.height / bitmap.width;
    const w = Number(widthInput.value) || 0;
    heightInput.value = Math.round(w * ratio);
  });

  heightInput.addEventListener("input", () => {
    if (!bitmap || !lockRatio.checked) return;
    const ratio = bitmap.width / bitmap.height;
    const h = Number(heightInput.value) || 0;
    widthInput.value = Math.round(h * ratio);
  });

  clearFileBtn.addEventListener("click", () => { currentFile = null; bitmap = null; fileInput.value = ""; showOnly(dropCard); });
  resetBtn.addEventListener("click", () => {
    currentFile = null; bitmap = null; fileInput.value = "";
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    showOnly(dropCard);
  });

  processBtn.addEventListener("click", async () => {
    if (!currentFile || !bitmap) return;

    let targetW, targetH;
    if (rMode === "percent") {
      const pct = Number(percentRange.value) / 100;
      targetW = Math.max(1, Math.round(bitmap.width * pct));
      targetH = Math.max(1, Math.round(bitmap.height * pct));
    } else {
      targetW = Math.max(1, Number(widthInput.value) || bitmap.width);
      targetH = Math.max(1, Number(heightInput.value) || bitmap.height);
    }

    setStatus("");
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    const mime = currentFile.type || "image/png";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92));

    if (!blob) {
      setStatus("Gagal resize gambar ini.", true);
      return;
    }

    const baseName = currentFile.name.replace(/\.[^/.]+$/, "");
    const ext = currentFile.name.split(".").pop() || "png";

    resultUrl = URL.createObjectURL(blob);
    dimBefore.textContent = `${bitmap.width}×${bitmap.height}`;
    dimAfter.textContent = `${targetW}×${targetH}`;
    downloadBtn.href = resultUrl;
    downloadBtn.download = `${baseName}-resized.${ext}`;
    showOnly(resultCard);
  });
}

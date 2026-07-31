export function initQrCode() {
  const textInput = document.getElementById("qrTextInput");
  const colorGrid = document.getElementById("qrColorGrid");
  const generateBtn = document.getElementById("qrGenerateBtn");
  const resultCard = document.getElementById("qrResultCard");
  const canvas = document.getElementById("qrCanvas");
  const downloadBtn = document.getElementById("qrDownloadBtn");
  const statusLine = document.getElementById("qrStatusLine");

  const COLORS = [
    { label: "Hitam", value: "#111111" },
    { label: "Biru", value: "#4f7cff" },
    { label: "Ungu", value: "#b45cff" },
    { label: "Mint", value: "#0f9c82" },
  ];
  let selectedColor = COLORS[0].value;

  COLORS.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.className = "format-btn" + (i === 0 ? " active" : "");
    btn.textContent = c.label;
    btn.addEventListener("click", () => {
      colorGrid.querySelectorAll(".format-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedColor = c.value;
    });
    colorGrid.appendChild(btn);
  });

  function setStatus(text, isError) {
    statusLine.textContent = text || "";
    statusLine.className = "status-line" + (isError ? " error" : "");
  }

  generateBtn.addEventListener("click", () => {
    const text = textInput.value.trim();
    if (!text) {
      setStatus("Isi teks atau link dulu.", true);
      return;
    }
    if (typeof window.QRCode === "undefined") {
      setStatus("Library QR belum siap, coba lagi sebentar.", true);
      return;
    }

    setStatus("");
    window.QRCode.toCanvas(
      canvas,
      text,
      { width: 260, margin: 2, color: { dark: selectedColor, light: "#ffffff" } },
      (err) => {
        if (err) {
          setStatus("Gagal bikin QR code.", true);
          return;
        }
        resultCard.hidden = false;
        downloadBtn.href = canvas.toDataURL("image/png");
      }
    );
  });
}

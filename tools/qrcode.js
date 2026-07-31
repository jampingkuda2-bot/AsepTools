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

  let qrLibPromise = null;

  // Load the QR library on demand instead of relying solely on the <script>
  // tag in index.html having finished by the time the user clicks Generate.
  // This also lets us recover automatically if that initial load was slow
  // or briefly failed (e.g. flaky mobile connection).
  function loadQrLibrary() {
    if (typeof window.QRCode !== "undefined") return Promise.resolve(window.QRCode);
    if (qrLibPromise) return qrLibPromise;

    qrLibPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-qrcode-lib]');
      if (existing) existing.remove();

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
      script.dataset.qrcodeLib = "true";
      script.onload = () => {
        if (typeof window.QRCode !== "undefined") resolve(window.QRCode);
        else reject(new Error("Library termuat tapi tidak terbaca."));
      };
      script.onerror = () => reject(new Error("Gagal mengunduh library QR."));
      document.head.appendChild(script);
    }).catch((err) => {
      qrLibPromise = null; // allow retrying on the next click
      throw err;
    });

    return qrLibPromise;
  }

  generateBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    if (!text) {
      setStatus("Isi teks atau link dulu.", true);
      return;
    }

    setStatus("Menyiapkan library QR...");
    generateBtn.disabled = true;

    let QRCode;
    try {
      QRCode = await loadQrLibrary();
    } catch (err) {
      setStatus("Gagal memuat library QR. Cek koneksi internet kamu lalu coba lagi.", true);
      generateBtn.disabled = false;
      return;
    }

    setStatus("");
    QRCode.toCanvas(
      canvas,
      text,
      { width: 260, margin: 2, color: { dark: selectedColor, light: "#ffffff" } },
      (err) => {
        generateBtn.disabled = false;
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

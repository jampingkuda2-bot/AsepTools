import { initTiktok } from "./tools/tiktok.js";
import { initCompress } from "./tools/compress.js";
import { initResize } from "./tools/resize.js";
import { initQrCode } from "./tools/qrcode.js";

const homeScreen = document.getElementById("homeScreen");
const allScreens = document.querySelectorAll(".screen");

function openScreen(id) {
  allScreens.forEach((s) => { s.hidden = s.id !== id; });
}

document.querySelectorAll(".app-icon").forEach((btn) => {
  btn.addEventListener("click", () => openScreen(btn.dataset.target));
});

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => openScreen("homeScreen"));
});

// Inisialisasi semua tool sekali di awal (murah, gak ada yang langsung fetch/load berat
// kecuali FFmpeg.wasm yang memang lazy-load sendiri pas dibutuhkan).
initTiktok();
initCompress();
initResize();
initQrCode();

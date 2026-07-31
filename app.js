import { initTiktok } from "./tools/tiktok.js";
import { initCompress } from "./tools/compress.js";
import { initResize } from "./tools/resize.js";
import { initQrCode } from "./tools/qrcode.js";
import { initUpload } from "./tools/upload.js";

const authScreen = document.getElementById("authScreen");
const homeScreen = document.getElementById("homeScreen");
const allScreens = document.querySelectorAll(".screen");
let toolsInitialized = false;

function openScreen(id) {
  allScreens.forEach((s) => { s.hidden = s.id !== id; });
}

document.querySelectorAll(".app-icon").forEach((btn) => {
  btn.addEventListener("click", () => openScreen(btn.dataset.target));
});

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => openScreen("homeScreen"));
});

function initToolsOnce() {
  if (toolsInitialized) return;
  toolsInitialized = true;
  // Inisialisasi semua tool sekali (murah, gak ada yang langsung fetch/load berat
  // kecuali FFmpeg.wasm & upload yang memang lazy-load sendiri pas dibutuhkan).
  initTiktok();
  initCompress();
  initResize();
  initQrCode();
  initUpload();
}

function showLoggedIn(user) {
  authScreen.hidden = true;
  openScreen("homeScreen");
  const userBar = document.getElementById("userBar");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.getElementById("userName");
  userBar.hidden = false;
  userName.textContent = user.name || user.email || "Pengguna";
  if (user.avatar) {
    userAvatar.style.backgroundImage = `url(${user.avatar})`;
    userAvatar.style.backgroundSize = "cover";
    userAvatar.textContent = "";
  } else {
    userAvatar.textContent = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
  }
  initToolsOnce();
}

function showLoggedOut() {
  homeScreen.hidden = true;
  authScreen.hidden = false;
}

async function checkSession() {
  try {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    if (data.user) showLoggedIn(data.user);
    else showLoggedOut();
  } catch (err) {
    console.error(err);
    showLoggedOut();
  }
}

// --- Auth screen: tab switching (Masuk / Daftar) ---
const authSegButtons = document.querySelectorAll("#authSegmented .seg-btn");
const authSegPill = document.getElementById("authSegPill");
const authNameField = document.getElementById("authNameField");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authForm = document.getElementById("authForm");
const authStatusLine = document.getElementById("authStatusLine");
let authMode = "login";

authSegButtons.forEach((btn, i) => {
  btn.addEventListener("click", () => {
    authMode = btn.dataset.authmode;
    authSegButtons.forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    authSegPill.style.transform = `translateX(${i * 100}%)`;
    authNameField.hidden = authMode !== "register";
    authSubmitBtn.textContent = authMode === "register" ? "Daftar" : "Masuk";
    authStatusLine.textContent = "";
    authStatusLine.className = "status-line";
  });
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const name = document.getElementById("authName").value.trim();

  authSubmitBtn.disabled = true;
  authStatusLine.textContent = authMode === "register" ? "Membuat akun..." : "Masuk...";
  authStatusLine.className = "status-line";

  try {
    const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body = authMode === "register" ? { email, password, name } : { email, password };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal, coba lagi.");
    showLoggedIn(data.user);
  } catch (err) {
    authStatusLine.textContent = err.message || "Terjadi kesalahan.";
    authStatusLine.className = "status-line error";
  } finally {
    authSubmitBtn.disabled = false;
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
  document.getElementById("userBar").hidden = true;
  showLoggedOut();
});

// --- Handle redirect back from Google OAuth ---
(function handleOAuthRedirect() {
  const params = new URLSearchParams(location.search);
  const authResult = params.get("auth");
  if (authResult) {
    if (authResult === "error") {
      authStatusLine.textContent = "Login gagal. Coba lagi ya.";
      authStatusLine.className = "status-line error";
    }
    history.replaceState(null, "", location.pathname);
  }
})();

checkSession();

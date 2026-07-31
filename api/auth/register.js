const { createUser, signSession, setSessionCookie } = require("../../lib/auth");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, password, name } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Format email tidak valid." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }

    const { user, error } = await createUser({ email, password, name });
    if (error) return res.status(409).json({ error });

    const token = signSession(user);
    setSessionCookie(res, token);
    res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
  } catch (err) {
    console.error("register error:", err);
    const hint = /kv|@vercel\/kv/i.test(String(err.message))
      ? " (Pastikan Vercel KV Store sudah dibuat & disambungkan ke project ini.)"
      : "";
    res.status(500).json({ error: `Gagal membuat akun. Coba lagi nanti.${hint}` });
  }
};

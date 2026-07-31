const { findOrCreateOAuthUser, signSession, setSessionCookie } = require("../../../lib/auth");

module.exports = async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) {
    res.writeHead(302, { Location: "/?auth=error" });
    return res.end();
  }

  try {
    const proto = req.headers["x-forwarded-proto"] || "https";
    const redirectUri = `${proto}://${req.headers.host}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("Gagal ambil access token dari Google");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    const user = await findOrCreateOAuthUser({
      provider: "google",
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
    });

    const token = signSession(user);
    setSessionCookie(res, token);
    res.writeHead(302, { Location: "/?auth=success" });
    res.end();
  } catch (err) {
    console.error("google callback error:", err);
    res.writeHead(302, { Location: "/?auth=error" });
    res.end();
  }
};

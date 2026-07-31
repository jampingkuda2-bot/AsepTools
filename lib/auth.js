const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookie = require("cookie");
const { kv } = require("@vercel/kv");

const COOKIE_NAME = "tk_session";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-please-set-JWT_SECRET";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 hari

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function verifyPassword(password, hash) {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(password, hash);
}

function signSession(user) {
  return jwt.sign(
    {
      uid: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || null,
      provider: user.provider || "password",
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS }
  );
}

function verifySession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function getSessionFromReq(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_TTL_SECONDS,
    })
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}

async function findUserByEmail(email) {
  if (!email) return null;
  const id = await kv.get(`user:email:${email.toLowerCase()}`);
  if (!id) return null;
  return kv.get(`user:${id}`);
}

async function findUserById(id) {
  return kv.get(`user:${id}`);
}

async function createUser({ email, password, name }) {
  const normalizedEmail = email ? email.toLowerCase() : null;
  const existing = normalizedEmail ? await findUserByEmail(normalizedEmail) : null;
  if (existing) return { error: "Email ini sudah terdaftar. Coba masuk aja." };

  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const user = {
    id,
    email: normalizedEmail,
    name: name || (normalizedEmail ? normalizedEmail.split("@")[0] : "Pengguna"),
    passwordHash: password ? await hashPassword(password) : null,
    provider: "password",
    avatar: null,
    createdAt: Date.now(),
  };

  await kv.set(`user:${id}`, user);
  if (normalizedEmail) await kv.set(`user:email:${normalizedEmail}`, id);
  return { user };
}

async function findOrCreateOAuthUser({ provider, providerId, email, name, avatar }) {
  const id = `${provider}_${providerId}`;
  let user = await kv.get(`user:${id}`);
  if (!user) {
    const normalizedEmail = email ? email.toLowerCase() : null;
    user = {
      id,
      email: normalizedEmail,
      name: name || "Pengguna",
      provider,
      avatar: avatar || null,
      passwordHash: null,
      createdAt: Date.now(),
    };
    await kv.set(`user:${id}`, user);
    if (normalizedEmail) {
      const existingId = await kv.get(`user:email:${normalizedEmail}`);
      if (!existingId) await kv.set(`user:email:${normalizedEmail}`, id);
    }
  }
  return user;
}

module.exports = {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  getSessionFromReq,
  setSessionCookie,
  clearSessionCookie,
  findUserByEmail,
  findUserById,
  createUser,
  findOrCreateOAuthUser,
};

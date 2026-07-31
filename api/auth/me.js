const { getSessionFromReq } = require("../../lib/auth");

module.exports = async (req, res) => {
  const session = getSessionFromReq(req);
  if (!session) return res.status(200).json({ user: null });
  res.status(200).json({
    user: { id: session.uid, email: session.email, name: session.name, avatar: session.avatar },
  });
};

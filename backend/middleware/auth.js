const bcrypt = require("bcrypt");

function parseBasicAuth(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return null;

  const base64 = header.slice("Basic ".length).trim();
  let decoded = "";
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return null;
  }

  const idx = decoded.indexOf(":");
  if (idx === -1) return null;

  return { email: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
}

function requireAuth(db) {
  return async (req, res, next) => {
    const creds = parseBasicAuth(req);
    if (!creds) {
      return res
        .status(401)
        .set("WWW-Authenticate", 'Basic realm="bookstore"')
        .json({ error: "Missing Basic Auth" });
    }

    const user = await db.get(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
      [creds.email]
    );
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(creds.password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  };
}

function requireAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

module.exports = { requireAuth, requireAnyRole };

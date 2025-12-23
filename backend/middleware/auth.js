// backend/middleware/auth.js
// Basic Authentication + Role-based Authorization (Grade-3 friendly)

const bcrypt = require("bcrypt");

// Parses Authorization: Basic base64(email:password)
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

  const email = decoded.slice(0, idx).trim();
  const password = decoded.slice(idx + 1);

  if (!email || !password) return null;
  return { email, password };
}

// Middleware: require valid Basic Auth user
function requireAuth(db) {
  return async (req, res, next) => {
    try {
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

      if (!user) {
        return res
          .status(401)
          .set("WWW-Authenticate", 'Basic realm="bookstore"')
          .json({ error: "Invalid credentials" });
      }

      const ok = await bcrypt.compare(creds.password, user.password_hash);
      if (!ok) {
        return res
          .status(401)
          .set("WWW-Authenticate", 'Basic realm="bookstore"')
          .json({ error: "Invalid credentials" });
      }

      // Attach user to request
      req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
      next();
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
}

// Middleware: require one of the allowed roles
function requireAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        needed: roles,
        got: req.user.role,
      });
    }

    next();
  };
}

module.exports = { requireAuth, requireAnyRole };

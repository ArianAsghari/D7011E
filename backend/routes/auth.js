// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function authRouter(db) {
  const router = express.Router();

  // PUBLIC register -> always CUSTOMER (secure + grade-3 friendly)
  router.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "name, email, password required" });
      }

      const existing = await db.get("SELECT id FROM users WHERE email = ?", [email]);
      if (existing) return res.status(409).json({ error: "Email already exists" });

      const password_hash = await bcrypt.hash(password, 10);
      const r = await db.run(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'CUSTOMER')",
        [name, email, password_hash]
      );

      await db.run("INSERT OR IGNORE INTO profiles (user_id, phone) VALUES (?, ?)", [r.lastID, null]);
      res.status(201).json({ ok: true, userId: r.lastID, role: "CUSTOMER" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth check
  router.get("/me", requireAuth(db), (req, res) => {
    res.json(req.user);
  });

  // ADMIN creates users (CUSTOMER/EMPLOYEE/ADMIN)
  router.post("/admin/create-user", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "name, email, password, role required" });
      }
      if (!["CUSTOMER", "EMPLOYEE", "ADMIN"].includes(role)) {
        return res.status(400).json({ error: "role must be CUSTOMER/EMPLOYEE/ADMIN" });
      }

      const existing = await db.get("SELECT id FROM users WHERE email = ?", [email]);
      if (existing) return res.status(409).json({ error: "Email already exists" });

      const password_hash = await bcrypt.hash(password, 10);
      const r = await db.run(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [name, email, password_hash, role]
      );

      await db.run("INSERT OR IGNORE INTO profiles (user_id, phone) VALUES (?, ?)", [r.lastID, null]);
      res.status(201).json({ ok: true, userId: r.lastID, role });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { authRouter };

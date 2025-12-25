// backend/routes/profiles.js
const express = require("express");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function profilesRouter(db) {
  const router = express.Router();

  // GET own profile
  router.get(
    "/me",
    requireAuth(db),
    requireAnyRole("CUSTOMER", "EMPLOYEE", "ADMIN"),
    async (req, res) => {
      const row = await db.get(
        "SELECT * FROM profiles WHERE user_id=?",
        [req.user.id]
      );
      res.json(row || { user_id: req.user.id, phone: null });
    }
  );

  // UPDATE own profile
  router.put(
    "/me",
    requireAuth(db),
    requireAnyRole("CUSTOMER", "EMPLOYEE", "ADMIN"),
    async (req, res) => {
      const phone = req.body?.phone ?? null;

      await db.run(
        "INSERT OR IGNORE INTO profiles (user_id, phone) VALUES (?, ?)",
        [req.user.id, null]
      );
      await db.run(
        "UPDATE profiles SET phone=? WHERE user_id=?",
        [phone, req.user.id]
      );

      const updated = await db.get(
        "SELECT * FROM profiles WHERE user_id=?",
        [req.user.id]
      );
      res.json(updated);
    }
  );

  // ADMIN: list all profiles
  router.get(
    "/",
    requireAuth(db),
    requireAnyRole("ADMIN"),
    async (req, res) => {
      const rows = await db.all(
        "SELECT * FROM profiles ORDER BY user_id DESC"
      );
      res.json(rows);
    }
  );

  // ADMIN: get profile by userId
  router.get(
    "/:userId",
    requireAuth(db),
    requireAnyRole("ADMIN"),
    async (req, res) => {
      const row = await db.get(
        "SELECT * FROM profiles WHERE user_id=?",
        [req.params.userId]
      );
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    }
  );

  // ADMIN: create profile
  router.post(
    "/",
    requireAuth(db),
    requireAnyRole("ADMIN"),
    async (req, res) => {
      const { user_id, phone = null } = req.body || {};
      if (!user_id)
        return res.status(400).json({ error: "user_id required" });

      const user = await db.get(
        "SELECT id FROM users WHERE id=?",
        [user_id]
      );
      if (!user)
        return res.status(400).json({ error: "User not found" });

      await db.run(
        "INSERT INTO profiles (user_id, phone) VALUES (?, ?)",
        [user_id, phone]
      );

      const created = await db.get(
        "SELECT * FROM profiles WHERE user_id=?",
        [user_id]
      );
      res.status(201).json(created);
    }
  );

  // ADMIN: delete profile
  router.delete(
    "/:userId",
    requireAuth(db),
    requireAnyRole("ADMIN"),
    async (req, res) => {
      const existing = await db.get(
        "SELECT user_id FROM profiles WHERE user_id=?",
        [req.params.userId]
      );
      if (!existing)
        return res.status(404).json({ error: "Not found" });

      await db.run(
        "DELETE FROM profiles WHERE user_id=?",
        [req.params.userId]
      );
      res.json({ ok: true });
    }
  );

  return router;
}

module.exports = { profilesRouter };

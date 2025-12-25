// backend/routes/images.js
const express = require("express");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function imagesRouter(db) {
  const router = express.Router();

  // GET /api/images  (EMPLOYEE/ADMIN)
  router.get("/", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    const rows = await db.all("SELECT * FROM images ORDER BY id DESC");
    res.json(rows);
  });

  // GET /api/images/:id (EMPLOYEE/ADMIN)
  router.get("/:id", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    const row = await db.get("SELECT * FROM images WHERE id=?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });

  // POST /api/images (ADMIN)
  router.post("/", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "url required" });

    const r = await db.run("INSERT INTO images (url) VALUES (?)", [url.trim()]);
    const created = await db.get("SELECT * FROM images WHERE id=?", [r.lastID]);
    res.status(201).json(created);
  });

  // PUT /api/images/:id (ADMIN)
  router.put("/:id", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    const id = req.params.id;
    const existing = await db.get("SELECT * FROM images WHERE id=?", [id]);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const url = (req.body?.url ?? existing.url).toString().trim();
    await db.run("UPDATE images SET url=? WHERE id=?", [url, id]);

    const updated = await db.get("SELECT * FROM images WHERE id=?", [id]);
    res.json(updated);
  });

  // DELETE /api/images/:id (ADMIN)
  router.delete("/:id", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    const id = req.params.id;
    const existing = await db.get("SELECT id FROM images WHERE id=?", [id]);
    if (!existing) return res.status(404).json({ error: "Not found" });

    // books.image_id has ON DELETE SET NULL, so delete is safe
    await db.run("DELETE FROM images WHERE id=?", [id]);
    res.json({ ok: true });
  });

  return router;
}

module.exports = { imagesRouter };

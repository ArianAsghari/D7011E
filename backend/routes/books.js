// backend/routes/books.js
const express = require("express");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function booksRouter(db) {
  const router = express.Router();

  // PUBLIC: GET /api/books
  router.get("/", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM books ORDER BY id DESC");
      res.json(rows);
    } catch (err) {
      console.error("GET /api/books failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // PUBLIC: GET /api/books/:id
  router.get("/:id", async (req, res) => {
    try {
      const row = await db.get("SELECT * FROM books WHERE id = ?", [req.params.id]);
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (err) {
      console.error("GET /api/books/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // EMPLOYEE/ADMIN: POST /api/books
  router.post(
    "/",
    requireAuth(db),
    requireAnyRole("EMPLOYEE", "ADMIN"),
    async (req, res) => {
      try {
        const {
          name,
          author,
          description = "",
          language = null,
          year = null,
          price,
          stock,
          image_id = null,
        } = req.body || {};

        if (!name || !author || price == null || stock == null) {
          return res.status(400).json({ error: "Missing fields" });
        }

        const r = await db.run(
          `INSERT INTO books (name, author, description, language, year, price, stock, image_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, author, description, language, year, price, stock, image_id]
        );

        const created = await db.get("SELECT * FROM books WHERE id = ?", [r.lastID]);
        res.status(201).json(created);
      } catch (err) {
        console.error("POST /api/books failed:", err);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  // EMPLOYEE/ADMIN: PUT /api/books/:id
  router.put(
    "/:id",
    requireAuth(db),
    requireAnyRole("EMPLOYEE", "ADMIN"),
    async (req, res) => {
      try {
        const id = req.params.id;
        const existing = await db.get("SELECT * FROM books WHERE id = ?", [id]);
        if (!existing) return res.status(404).json({ error: "Not found" });

        const b = { ...existing, ...(req.body || {}) };

        await db.run(
          `UPDATE books
           SET name=?, author=?, description=?, language=?, year=?, price=?, stock=?, image_id=?
           WHERE id=?`,
          [
            b.name,
            b.author,
            b.description ?? "",
            b.language ?? null,
            b.year ?? null,
            b.price,
            b.stock,
            b.image_id ?? null,
            id,
          ]
        );

        const updated = await db.get("SELECT * FROM books WHERE id = ?", [id]);
        res.json(updated);
      } catch (err) {
        console.error("PUT /api/books/:id failed:", err);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  // ADMIN: DELETE /api/books/:id
  router.delete(
    "/:id",
    requireAuth(db),
    requireAnyRole("ADMIN"),
    async (req, res) => {
      try {
        const id = req.params.id;
        const existing = await db.get("SELECT id FROM books WHERE id = ?", [id]);
        if (!existing) return res.status(404).json({ error: "Not found" });

        await db.run("DELETE FROM books WHERE id = ?", [id]);
        res.json({ ok: true });
      } catch (err) {
        console.error("DELETE /api/books/:id failed:", err);
        res.status(400).json({ error: "Could not delete (may be referenced by orders)" });
      }
    }
  );

  return router;
}

module.exports = { booksRouter };

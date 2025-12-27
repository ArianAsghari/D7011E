// backend/routes/books.js
const express = require("express");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function booksRouter(db) {
  const router = express.Router();

  // PUBLIC: GET /api/books
  router.get("/", async (req, res) => {
    try {
      const q = (req.query.q || "").trim();
      let rows;

      // Optional search support (WITH image_url)
      if (q) {
        rows = await db.all(
          `SELECT b.*, i.url AS image_url
           FROM books b
           LEFT JOIN images i ON i.id = b.image_id
           WHERE b.name LIKE ? OR b.author LIKE ?
           ORDER BY b.id DESC`,
          [`%${q}%`, `%${q}%`]
        );
      } else {
        rows = await db.all(
          `SELECT b.*, i.url AS image_url
           FROM books b
           LEFT JOIN images i ON i.id = b.image_id
           ORDER BY b.id DESC`
        );
      }

      res.json(rows);
    } catch (err) {
      console.error("GET /api/books failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // PUBLIC: GET /api/books/:id
  router.get("/:id", async (req, res) => {
    try {
      const row = await db.get(
        `SELECT b.*, i.url AS image_url
         FROM books b
         LEFT JOIN images i ON i.id = b.image_id
         WHERE b.id = ?`,
        [req.params.id]
      );
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (err) {
      console.error("GET /api/books/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // EMPLOYEE/ADMIN: POST /api/books  (create)
  router.post("/", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
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

      // Return created with image_url (optional but nice)
      const created = await db.get(
        `SELECT b.*, i.url AS image_url
         FROM books b
         LEFT JOIN images i ON i.id = b.image_id
         WHERE b.id = ?`,
        [r.lastID]
      );

      res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/books failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // EMPLOYEE/ADMIN: PUT /api/books/:id  (update/edit)
  router.put("/:id", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const id = req.params.id;

      const existing = await db.get("SELECT * FROM books WHERE id = ?", [id]);
      if (!existing) return res.status(404).json({ error: "Not found" });

      // Merge existing + incoming fields
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

      // Return updated with image_url (optional but nice)
      const updated = await db.get(
        `SELECT b.*, i.url AS image_url
         FROM books b
         LEFT JOIN images i ON i.id = b.image_id
         WHERE b.id = ?`,
        [id]
      );

      res.json(updated);
    } catch (err) {
      console.error("PUT /api/books/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // EMPLOYEE/ADMIN: DELETE /api/books/:id  (delete)
  router.delete(
    "/:id",
    requireAuth(db),
    requireAnyRole("EMPLOYEE", "ADMIN"),
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

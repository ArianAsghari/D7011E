const express = require("express");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function booksRouter(db) {
  const router = express.Router();

  // SEARCH: /api/books?search=harry
  router.get("/", async (req, res) => {
    try {
      const q = (req.query.search || "").toString().trim();

      const rows = q
        ? await db.all(
            `SELECT b.*, i.url AS image_url
             FROM books b
             LEFT JOIN images i ON i.id = b.image_id
             WHERE LOWER(b.name) LIKE LOWER(?) OR LOWER(b.author) LIKE LOWER(?)
             ORDER BY b.id DESC`,
            [`%${q}%`, `%${q}%`]
          )
        : await db.all(
            `SELECT b.*, i.url AS image_url
             FROM books b
             LEFT JOIN images i ON i.id = b.image_id
             ORDER BY b.id DESC`
          );

      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const row = await db.get(
        `SELECT b.*, i.url AS image_url
         FROM books b
         LEFT JOIN images i ON i.id = b.image_id
         WHERE b.id = ?`,
        [id]
      );
      if (!row) return res.status(404).json({ error: "Book not found" });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create book (EMPLOYEE/ADMIN)
  router.post("/", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const { name, author, description, year, language, price, stock, image_url } = req.body;
      if (!name || !author || price === undefined || stock === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let imageId = null;
      if (image_url) {
        const r = await db.run("INSERT INTO images (url) VALUES (?)", [image_url]);
        imageId = r.lastID;
      }

      const r = await db.run(
        `INSERT INTO books (name, author, description, year, language, price, stock, image_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          author,
          description ?? "",
          year ?? null,
          language ?? "en",
          price,
          stock,
          imageId,
        ]
      );

      const created = await db.get("SELECT * FROM books WHERE id = ?", [r.lastID]);
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update book details (EMPLOYEE/ADMIN)
  router.put("/:id", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await db.get("SELECT * FROM books WHERE id = ?", [id]);
      if (!existing) return res.status(404).json({ error: "Book not found" });

      const { name, author, description, year, language, price, stock, image_id } = req.body;

      await db.run(
        `UPDATE books SET name=?, author=?, description=?, year=?, language=?, price=?, stock=?, image_id=? WHERE id=?`,
        [
          name ?? existing.name,
          author ?? existing.author,
          description ?? existing.description,
          year ?? existing.year,
          language ?? existing.language,
          price ?? existing.price,
          stock ?? existing.stock,
          image_id ?? existing.image_id,
          id,
        ]
      );

      const updated = await db.get("SELECT * FROM books WHERE id = ?", [id]);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Change only stock (quantity) (EMPLOYEE/ADMIN) — easier endpoint
  router.patch("/:id/stock", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const stock = Number(req.body.stock);

      if (!Number.isFinite(stock) || stock < 0) {
        return res.status(400).json({ error: "stock must be a number >= 0" });
      }

      const existing = await db.get("SELECT * FROM books WHERE id = ?", [id]);
      if (!existing) return res.status(404).json({ error: "Book not found" });

      await db.run("UPDATE books SET stock = ? WHERE id = ?", [stock, id]);
      const updated = await db.get("SELECT * FROM books WHERE id = ?", [id]);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete book (EMPLOYEE/ADMIN)
  router.delete("/:id", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await db.get("SELECT * FROM books WHERE id = ?", [id]);
      if (!existing) return res.status(404).json({ error: "Book not found" });

      await db.run("DELETE FROM books WHERE id = ?", [id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { booksRouter };

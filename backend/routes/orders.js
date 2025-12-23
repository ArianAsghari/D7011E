const express = require("express");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function ordersRouter(db) {
  const router = express.Router();

  // CUSTOMER/ADMIN checkout
  router.post("/", requireAuth(db), requireAnyRole("CUSTOMER", "ADMIN"), async (req, res) => {
    try {
      const items = Array.isArray(req.body.items) ? req.body.items : [];
      if (items.length === 0) return res.status(400).json({ error: "items required" });

      // validate stock
      for (const it of items) {
        const bookId = Number(it.bookId);
        const qty = Number(it.quantity);
        if (!bookId || !qty || qty <= 0) return res.status(400).json({ error: "Invalid items" });

        const book = await db.get("SELECT stock FROM books WHERE id = ?", [bookId]);
        if (!book) return res.status(400).json({ error: `Book not found: ${bookId}` });
        if (book.stock < qty) return res.status(400).json({ error: `Not enough stock for ${bookId}` });
      }

      await db.exec("BEGIN");
      const r = await db.run("INSERT INTO orders (customer_id, status) VALUES (?, 'NEW')", [req.user.id]);
      const orderId = r.lastID;

      for (const it of items) {
        const bookId = Number(it.bookId);
        const qty = Number(it.quantity);
        await db.run("INSERT INTO order_items (order_id, book_id, quantity) VALUES (?, ?, ?)", [orderId, bookId, qty]);
        await db.run("UPDATE books SET stock = stock - ? WHERE id = ?", [qty, bookId]);
      }

      await db.exec("COMMIT");
      res.status(201).json({ ok: true, orderId });
    } catch (err) {
      try { await db.exec("ROLLBACK"); } catch {}
      res.status(500).json({ error: err.message });
    }
  });

  // CUSTOMER/ADMIN: my orders
  router.get("/mine", requireAuth(db), requireAnyRole("CUSTOMER", "ADMIN"), async (req, res) => {
    try {
      const orders = await db.all(
        "SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC",
        [req.user.id]
      );

      const result = [];
      for (const o of orders) {
        const items = await db.all(
          `SELECT oi.book_id, oi.quantity, b.name, b.author, b.price
           FROM order_items oi JOIN books b ON b.id = oi.book_id
           WHERE oi.order_id = ?`,
          [o.id]
        );
        result.push({ ...o, items });
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { ordersRouter };

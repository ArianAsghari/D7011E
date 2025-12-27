// backend/routes/order-items.js
const express = require("express");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function orderItemsRouter(db) {
  const router = express.Router();

  // Helper: load order + enforce manager access
  async function loadOrder(orderId) {
    return db.get("SELECT * FROM orders WHERE id=?", [orderId]);
  }

  // CREATE: add item to an order
  // POST /api/order-items  body: { order_id, book_id, quantity }
  router.post("/", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const order_id = Number(req.body?.order_id);
      const book_id = Number(req.body?.book_id);
      const quantity = Number(req.body?.quantity);

      if (!Number.isInteger(order_id) || order_id <= 0) return res.status(400).json({ error: "Bad order_id" });
      if (!Number.isInteger(book_id) || book_id <= 0) return res.status(400).json({ error: "Bad book_id" });
      if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ error: "Bad quantity" });

      const order = await loadOrder(order_id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const b = await db.get("SELECT id, price, stock FROM books WHERE id=?", [book_id]);
      if (!b) return res.status(404).json({ error: "Book not found" });
      if (b.stock < quantity) return res.status(400).json({ error: "Not enough stock" });

      await db.exec("BEGIN");
      try {
        // if exists -> increase qty, else insert
        const existing = await db.get(
          "SELECT * FROM order_items WHERE order_id=? AND book_id=?",
          [order_id, book_id]
        );

        if (existing) {
          const newQty = Number(existing.quantity) + quantity;
          await db.run(
            "UPDATE order_items SET quantity=? WHERE order_id=? AND book_id=?",
            [newQty, order_id, book_id]
          );
        } else {
          await db.run(
            "INSERT INTO order_items (order_id, book_id, quantity, unit_price) VALUES (?,?,?,?)",
            [order_id, book_id, quantity, b.price]
          );
        }

        await db.run("UPDATE books SET stock = stock - ? WHERE id=?", [quantity, book_id]);

        await db.exec("COMMIT");
      } catch (e) {
        await db.exec("ROLLBACK");
        throw e;
      }

      const row = await db.get(
        "SELECT * FROM order_items WHERE order_id=? AND book_id=?",
        [order_id, book_id]
      );
      res.status(201).json(row);
    } catch (err) {
      console.error("POST /order-items failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // UPDATE: change quantity for one item
  // PUT /api/order-items/:orderId/:bookId  body: { quantity }
  router.put("/:orderId/:bookId", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const orderId = Number(req.params.orderId);
      const bookId = Number(req.params.bookId);
      const quantity = Number(req.body?.quantity);

      if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ error: "Bad orderId" });
      if (!Number.isInteger(bookId) || bookId <= 0) return res.status(400).json({ error: "Bad bookId" });
      if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ error: "Bad quantity" });

      const order = await loadOrder(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const existing = await db.get(
        "SELECT * FROM order_items WHERE order_id=? AND book_id=?",
        [orderId, bookId]
      );
      if (!existing) return res.status(404).json({ error: "Item not found" });

      const oldQty = Number(existing.quantity);
      const diff = quantity - oldQty; // + means need more stock, - means restock

      const b = await db.get("SELECT id, stock FROM books WHERE id=?", [bookId]);
      if (!b) return res.status(404).json({ error: "Book not found" });

      if (diff > 0 && b.stock < diff) return res.status(400).json({ error: "Not enough stock" });

      await db.exec("BEGIN");
      try {
        await db.run(
          "UPDATE order_items SET quantity=? WHERE order_id=? AND book_id=?",
          [quantity, orderId, bookId]
        );

        // adjust stock
        if (diff !== 0) {
          await db.run("UPDATE books SET stock = stock - ? WHERE id=?", [diff, bookId]);
        }

        await db.exec("COMMIT");
      } catch (e) {
        await db.exec("ROLLBACK");
        throw e;
      }

      const updated = await db.get(
        "SELECT * FROM order_items WHERE order_id=? AND book_id=?",
        [orderId, bookId]
      );
      res.json(updated);
    } catch (err) {
      console.error("PUT /order-items failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // DELETE: remove one item from order (and restock)
  // DELETE /api/order-items/:orderId/:bookId
  router.delete("/:orderId/:bookId", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const orderId = Number(req.params.orderId);
      const bookId = Number(req.params.bookId);

      if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ error: "Bad orderId" });
      if (!Number.isInteger(bookId) || bookId <= 0) return res.status(400).json({ error: "Bad bookId" });

      const order = await loadOrder(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const existing = await db.get(
        "SELECT * FROM order_items WHERE order_id=? AND book_id=?",
        [orderId, bookId]
      );
      if (!existing) return res.status(404).json({ error: "Item not found" });

      const qty = Number(existing.quantity);

      await db.exec("BEGIN");
      try {
        await db.run("DELETE FROM order_items WHERE order_id=? AND book_id=?", [orderId, bookId]);
        // restock
        await db.run("UPDATE books SET stock = stock + ? WHERE id=?", [qty, bookId]);
        await db.exec("COMMIT");
      } catch (e) {
        await db.exec("ROLLBACK");
        throw e;
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /order-items failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}

module.exports = { orderItemsRouter };

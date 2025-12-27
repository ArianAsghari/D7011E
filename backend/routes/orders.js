// backend/routes/orders.js
const express = require("express");
const bcrypt = require("bcrypt");
const { requireAuth, requireAnyRole } = require("../middleware/auth");

function ordersRouter(db) {
  const router = express.Router();

  // ---------------------------
  // ADMIN: Users CRUD
  // Mounted at /api/orders (so these become /api/orders/users etc)
  // ---------------------------
  router.get("/users", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    try {
      const rows = await db.all("SELECT id,email,name,role FROM users ORDER BY id DESC");
      res.json(rows);
    } catch (err) {
      console.error("GET /orders/users failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  router.get("/users/:id", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    try {
      const u = await db.get("SELECT id,email,name,role FROM users WHERE id=?", [req.params.id]);
      if (!u) return res.status(404).json({ error: "Not found" });
      res.json(u);
    } catch (err) {
      console.error("GET /orders/users/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  router.post("/users", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    try {
      const { email, password, name, role } = req.body || {};
      if (!email || !password || !name || !role) {
        return res.status(400).json({ error: "Missing fields" });
      }
      if (!["CUSTOMER", "EMPLOYEE", "ADMIN"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const existing = await db.get("SELECT id FROM users WHERE email=?", [email.trim()]);
      if (existing) return res.status(409).json({ error: "Email already exists" });

      const hash = await bcrypt.hash(password, 10);
      const r = await db.run(
        "INSERT INTO users (email,name,password_hash,role) VALUES (?,?,?,?)",
        [email.trim(), name.trim(), hash, role]
      );
      await db.run("INSERT OR IGNORE INTO profiles (user_id, phone) VALUES (?, ?)", [r.lastID, null]);

      res.status(201).json({ ok: true, id: r.lastID });
    } catch (err) {
      console.error("POST /orders/users failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // ADMIN/EMPLOYEE: list ALL orders with customer + items
  // GET /api/orders/admin
  router.get(
    "/admin",
    requireAuth(db),
    requireAnyRole("EMPLOYEE", "ADMIN"),
    async (req, res) => {
      try {
        const orders = await db.all(
          `SELECT o.*, u.email AS customer_email, u.name AS customer_name
           FROM orders o
           JOIN users u ON u.id = o.customer_id
           ORDER BY o.id DESC`
        );

        const out = [];
        for (const o of orders) {
          const items = await db.all(
            `SELECT oi.book_id, oi.quantity, oi.unit_price,
                    b.name AS book_name, b.author AS book_author
             FROM order_items oi
             JOIN books b ON b.id = oi.book_id
             WHERE oi.order_id = ?
             ORDER BY b.name`,
            [o.id]
          );
          out.push({ ...o, items });
        }

        res.json(out);
      } catch (err) {
        console.error("GET /orders/admin failed:", err);
        res.status(500).json({ error: "Server error" });
      }
    }
  );


  router.put("/users/:id", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    try {
      const id = req.params.id;
      const existing = await db.get("SELECT id,email,name,role FROM users WHERE id=?", [id]);
      if (!existing) return res.status(404).json({ error: "Not found" });

      const { name, role } = req.body || {};
      const newName = (name ?? existing.name).toString();
      const newRole = (role ?? existing.role).toString();

      if (!["CUSTOMER", "EMPLOYEE", "ADMIN"].includes(newRole)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      await db.run("UPDATE users SET name=?, role=? WHERE id=?", [newName, newRole, id]);
      const updated = await db.get("SELECT id,email,name,role FROM users WHERE id=?", [id]);
      res.json(updated);
    } catch (err) {
      console.error("PUT /orders/users/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  router.delete("/users/:id", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    try {
      const id = req.params.id;
      const existing = await db.get("SELECT id FROM users WHERE id=?", [id]);
      if (!existing) return res.status(404).json({ error: "Not found" });
      await db.run("DELETE FROM users WHERE id=?", [id]);
      res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /orders/users/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // ---------------------------
  // Orders CRUD (customer + employee/admin)
  // Actual orders endpoints:
  // POST   /api/orders
  // GET    /api/orders
  // GET    /api/orders/my
  // GET    /api/orders/:id
  // PUT    /api/orders/:id       (EMPLOYEE/ADMIN)
  // DELETE /api/orders/:id       (ADMIN)
  // ---------------------------

  // Create order from cart
  router.post("/", requireAuth(db), requireAnyRole("CUSTOMER", "EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const items = req.body?.items;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing items" });
      }

      // Validate items + stock, capture unit_price
      const validated = [];
      for (const it of items) {
        const bookId = Number(it?.book_id);
        const qty = Number(it?.quantity);

        if (!Number.isInteger(bookId) || bookId <= 0) {
          return res.status(400).json({ error: "Invalid book_id" });
        }
        if (!Number.isInteger(qty) || qty <= 0) {
          return res.status(400).json({ error: "Invalid quantity" });
        }

        const b = await db.get("SELECT id, price, stock FROM books WHERE id=?", [bookId]);
        if (!b) return res.status(400).json({ error: `Book not found: ${bookId}` });
        if (b.stock < qty) return res.status(400).json({ error: `Not enough stock for book ${bookId}` });

        validated.push({ book_id: b.id, quantity: qty, unit_price: b.price });
      }

      // customer_id matches your db.js schema
      const o = await db.run("INSERT INTO orders (customer_id, status) VALUES (?, 'NEW')", [req.user.id]);

      for (const v of validated) {
        await db.run(
          "INSERT INTO order_items (order_id, book_id, quantity, unit_price) VALUES (?,?,?,?)",
          [o.lastID, v.book_id, v.quantity, v.unit_price]
        );
        await db.run("UPDATE books SET stock = stock - ? WHERE id = ?", [v.quantity, v.book_id]);
      }

      const created = await db.get("SELECT * FROM orders WHERE id=?", [o.lastID]);
      res.status(201).json(created);
    } catch (err) {
      console.error("POST /orders failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // List orders (customer sees only own)
  router.get("/", requireAuth(db), requireAnyRole("CUSTOMER", "EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      if (req.user.role === "CUSTOMER") {
        const rows = await db.all(
          "SELECT * FROM orders WHERE customer_id=? ORDER BY id DESC",
          [req.user.id]
        );
        return res.json(rows);
      }
      const rows = await db.all("SELECT * FROM orders ORDER BY id DESC");
      res.json(rows);
    } catch (err) {
      console.error("GET /orders failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // My orders with items (for frontend my-orders page)
  router.get("/my", requireAuth(db), requireAnyRole("CUSTOMER", "EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const orders = await db.all(
        "SELECT * FROM orders WHERE customer_id=? ORDER BY id DESC",
        [req.user.id]
      );

      const out = [];
      for (const o of orders) {
        const items = await db.all(
          `SELECT oi.book_id, oi.quantity, oi.unit_price, b.name, b.author
           FROM order_items oi
           JOIN books b ON b.id = oi.book_id
           WHERE oi.order_id = ?`,
          [o.id]
        );
        out.push({ ...o, items });
      }

      res.json(out);
    } catch (err) {
      console.error("GET /orders/my failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Order details with items
  router.get("/:id", requireAuth(db), requireAnyRole("CUSTOMER", "EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const id = req.params.id;
      const order = await db.get("SELECT * FROM orders WHERE id=?", [id]);
      if (!order) return res.status(404).json({ error: "Not found" });

      if (req.user.role === "CUSTOMER" && order.customer_id !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const items = await db.all(
        `SELECT oi.book_id, oi.quantity, oi.unit_price, b.name, b.author
         FROM order_items oi
         JOIN books b ON b.id = oi.book_id
         WHERE oi.order_id = ?`,
        [id]
      );

      res.json({ ...order, items });
    } catch (err) {
      console.error("GET /orders/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Update status (EMPLOYEE/ADMIN)
  router.put("/:id", requireAuth(db), requireAnyRole("EMPLOYEE", "ADMIN"), async (req, res) => {
    try {
      const id = req.params.id;
      const existing = await db.get("SELECT * FROM orders WHERE id=?", [id]);
      if (!existing) return res.status(404).json({ error: "Not found" });

      const status = (req.body?.status ?? existing.status).toString();
      await db.run("UPDATE orders SET status=? WHERE id=?", [status, id]);

      const updated = await db.get("SELECT * FROM orders WHERE id=?", [id]);
      res.json(updated);
    } catch (err) {
      console.error("PUT /orders/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Delete order (ADMIN)
  router.delete("/:id", requireAuth(db), requireAnyRole("ADMIN"), async (req, res) => {
    try {
      const id = req.params.id;
      const existing = await db.get("SELECT id FROM orders WHERE id=?", [id]);
      if (!existing) return res.status(404).json({ error: "Not found" });

      await db.run("DELETE FROM orders WHERE id=?", [id]);
      res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /orders/:id failed:", err);
      res.status(500).json({ error: "Server error" });
    }
  });


  // Update single order item quantity (EMPLOYEE/ADMIN)
  // PUT /api/orders/:orderId/items/:bookId
  router.put(
    "/:orderId/items/:bookId",
    requireAuth(db),
    requireAnyRole("EMPLOYEE", "ADMIN"),
    async (req, res) => {
      try {
        const orderId = Number(req.params.orderId);
        const bookId = Number(req.params.bookId);
        const newQty = Number(req.body?.quantity);

        if (!Number.isInteger(orderId) || orderId <= 0) {
          return res.status(400).json({ error: "Bad orderId" });
        }
        if (!Number.isInteger(bookId) || bookId <= 0) {
          return res.status(400).json({ error: "Bad bookId" });
        }
        if (!Number.isInteger(newQty) || newQty <= 0) {
          return res.status(400).json({ error: "quantity must be > 0" });
        }

        // must exist
        const existing = await db.get(
          "SELECT quantity FROM order_items WHERE order_id=? AND book_id=?",
          [orderId, bookId]
        );
        if (!existing) return res.status(404).json({ error: "Order item not found" });

        const oldQty = Number(existing.quantity);
        const diff = newQty - oldQty; // + => need more stock, - => return stock

        if (diff > 0) {
          const b = await db.get("SELECT stock FROM books WHERE id=?", [bookId]);
          if (!b || b.stock < diff) return res.status(400).json({ error: "Not enough stock" });
        }

        await db.exec("BEGIN");
        try {
          await db.run(
            "UPDATE order_items SET quantity=? WHERE order_id=? AND book_id=?",
            [newQty, orderId, bookId]
          );

          if (diff !== 0) {
            // diff > 0 reduces stock, diff < 0 increases stock
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
        console.error("PUT /orders/:orderId/items/:bookId failed:", err);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

    // Delete single order item (EMPLOYEE/ADMIN)
  // DELETE /api/orders/:orderId/items/:bookId
  router.delete(
    "/:orderId/items/:bookId",
    requireAuth(db),
    requireAnyRole("EMPLOYEE", "ADMIN"),
    async (req, res) => {
      try {
        const orderId = Number(req.params.orderId);
        const bookId = Number(req.params.bookId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
          return res.status(400).json({ error: "Bad orderId" });
        }
        if (!Number.isInteger(bookId) || bookId <= 0) {
          return res.status(400).json({ error: "Bad bookId" });
        }

        const existing = await db.get(
          "SELECT quantity FROM order_items WHERE order_id=? AND book_id=?",
          [orderId, bookId]
        );
        if (!existing) return res.status(404).json({ error: "Order item not found" });

        const qty = Number(existing.quantity);

        await db.exec("BEGIN");
        try {
          await db.run("DELETE FROM order_items WHERE order_id=? AND book_id=?", [orderId, bookId]);

          // return stock
          await db.run("UPDATE books SET stock = stock + ? WHERE id=?", [qty, bookId]);

          await db.exec("COMMIT");
        } catch (e) {
          await db.exec("ROLLBACK");
          throw e;
        }

        res.json({ ok: true });
      } catch (err) {
        console.error("DELETE /orders/:orderId/items/:bookId failed:", err);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  return router;
}
module.exports = { ordersRouter };

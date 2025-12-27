import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, Role } from '../../services/auth';
import { OrdersService } from '../../services/orders';

type OrderItem = {
  book_id: number;
  book_name: string;
  book_author: string;
  quantity: number;
  unit_price: number;
};

type OrderRow = {
  id: number;
  customer_id: number;
  customer_email: string;
  customer_name: string;
  status: string;
  created_at: string;
  items: OrderItem[];
};

@Component({
  selector: 'app-manager-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-orders.html',
  styleUrl: './manager-orders.css',
})
export class ManagerOrdersComponent {
  private auth = inject(AuthService);
  private ordersApi = inject(OrdersService);

  orders: OrderRow[] = [];
  err = '';
  ok = '';

  editStatus: Record<number, string> = {};
  editQty: Record<string, number> = {}; // `${orderId}:${bookId}`

  ngOnInit() {
    this.load();
  }

  canManage(): boolean {
    const r = this.auth.user()?.role as Role | undefined;
    return r === 'EMPLOYEE' || r === 'ADMIN';
  }

  load() {
    this.err = '';
    this.ok = '';

    if (!this.canManage()) {
      this.err = 'Forbidden';
      return;
    }

    this.ordersApi.adminOrders().subscribe({
      next: (rows: any) => {
        this.orders = rows || [];
        for (const o of this.orders) {
          this.editStatus[o.id] = o.status;
          for (const it of o.items || []) {
            this.editQty[`${o.id}:${it.book_id}`] = it.quantity;
          }
        }
      },
      error: (e) => (this.err = e?.error?.error ?? 'Could not load orders'),
    });
  }

  updateStatus(orderId: number) {
    this.err = '';
    this.ok = '';
    const status = this.editStatus[orderId];

    this.ordersApi.updateStatus(orderId, status).subscribe({
      next: () => {
        this.ok = `Updated order #${orderId}`;
        this.load();
      },
      error: (e) => (this.err = e?.error?.error ?? 'Update failed'),
    });
  }

  updateItemQty(orderId: number, bookId: number) {
    this.err = '';
    this.ok = '';
    const quantity = Number(this.editQty[`${orderId}:${bookId}`]);

    this.ordersApi.updateItemQty(orderId, bookId, quantity).subscribe({
      next: () => {
        this.ok = `Updated item in order #${orderId}`;
        this.load();
      },
      error: (e) => (this.err = e?.error?.error ?? 'Item update failed'),
    });
  }

  deleteItem(orderId: number, bookId: number) {
    this.err = '';
    this.ok = '';

    this.ordersApi.deleteItem(orderId, bookId).subscribe({
      next: () => {
        this.ok = `Deleted item from order #${orderId}`;
        this.load();
      },
      error: (e) => (this.err = e?.error?.error ?? 'Delete failed'),
    });
  }
}

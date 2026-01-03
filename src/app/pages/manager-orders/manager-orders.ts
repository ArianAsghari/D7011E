import { Component, inject, OnInit, DoCheck, ChangeDetectorRef } from '@angular/core';
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
export class ManagerOrdersComponent implements OnInit, DoCheck {
  private auth = inject(AuthService);
  private ordersApi = inject(OrdersService);
  private cdr = inject(ChangeDetectorRef);

  orders: OrderRow[] = [];
  err = '';
  ok = '';

  editStatus: Record<number, string> = {};
  editQty: Record<string, number> = {}; // `${orderId}:${bookId}`
  
  private hasLoaded = false;
  private checkCount = 0;

  ngOnInit() {
    console.log('ManagerOrdersComponent - ngOnInit');
    this.load();
  }

  ngDoCheck() {
    this.checkCount++;
    console.log(`ManagerOrdersComponent - ngDoCheck #${this.checkCount}`);
    
    // If we haven't loaded data yet, try loading on every check
    if (!this.hasLoaded && this.checkCount > 1) {
      console.log('Attempting load in ngDoCheck');
      this.load();
    }
    
    // Force another check after a delay
    if (this.checkCount === 1) {
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    }
  }

  canManage(): boolean {
    const r = this.auth.user()?.role as Role | undefined;
    return r === 'EMPLOYEE' || r === 'ADMIN';
  }

  load() {
    console.log('load() called');
    this.err = '';
    this.ok = '';

    if (!this.canManage()) {
      this.err = 'Forbidden';
      this.hasLoaded = true;
      return;
    }

    this.ordersApi.adminOrders().subscribe({
      next: (rows: any) => {
        console.log('Orders loaded:', rows?.length || 0, 'items');
        this.orders = rows || [];
        for (const o of this.orders) {
          this.editStatus[o.id] = o.status;
          for (const it of o.items || []) {
            this.editQty[`${o.id}:${it.book_id}`] = it.quantity;
          }
        }
        this.hasLoaded = true;
        this.cdr.detectChanges(); // Force update
      },
      error: (e) => {
        this.err = e?.error?.error ?? 'Could not load orders';
        console.error('Load error:', e);
        this.hasLoaded = true;
      },
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
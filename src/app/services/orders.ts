import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:8080/api';

export type OrderItemInput = {
  book_id: number;
  quantity: number;
};

export type OrderItem = {
  book_id: number;
  quantity: number;
  unit_price: number;
  name?: string;
  author?: string;
  book_name?: string;
  book_author?: string;
};

export type Order = {
  id: number;
  customer_id: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
};

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);

  //  backend expects body: { items: [...] }
  checkout(items: OrderItemInput[]) {
    return this.http.post(`${API}/orders`, { items });
  }

  // CUSTOMER: my orders (with items)
  myOrders() {
    return this.http.get<Order[]>(`${API}/orders/my`);
  }

  // BACKWARD COMPAT: your my-orders.ts expects mine()
  mine() {
    return this.myOrders();
  }

  // list orders (customer gets own via backend logic)
  list() {
    return this.http.get<Order[]>(`${API}/orders`);
  }

  // manager/admin: all orders with customer + items
  adminOrders() {
    return this.http.get<any[]>(`${API}/orders/admin`);
  }

  updateStatus(orderId: number, status: string) {
    return this.http.put(`${API}/orders/${orderId}`, { status });
  }

  updateItemQty(orderId: number, bookId: number, quantity: number) {
    return this.http.put(`${API}/orders/${orderId}/items/${bookId}`, { quantity });
  }

  deleteItem(orderId: number, bookId: number) {
    return this.http.delete(`${API}/orders/${orderId}/items/${bookId}`);
  }
}

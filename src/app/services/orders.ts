import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type OrderItem = {
  book_id: number;
  quantity: number;
  name: string;
  author: string;
  price: number;
};

export type Order = {
  id: number;
  customer_id: number;
  status: string;
  items: OrderItem[];
};

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private api = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient) {}

  checkout(items: { bookId: number; quantity: number }[]) {
    return this.http.post<{ ok: true; orderId: number }>(this.api, { items });
  }

  mine(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.api}/mine`);
  }
}

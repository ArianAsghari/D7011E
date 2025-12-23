import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService, Order } from '../../services/orders';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrdersComponent {
  private ordersApi = inject(OrdersService);

  orders: Order[] = [];
  ngOnInit() {
    this.ordersApi.mine().subscribe((o) => (this.orders = o));
  }
}

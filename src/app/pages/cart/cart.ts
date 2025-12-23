import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { OrdersService } from '../../services/orders';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent {
  private cart = inject(CartService);
  private orders = inject(OrdersService);

  items = this.cart.items;
  total = computed(() => this.cart.total());

  remove(id: number) {
    this.cart.remove(id);
  }

  purchase() {
    const items = this.cart.toOrderItems();
    if (items.length === 0) return;

    this.orders.checkout(items).subscribe({
      next: () => {
        alert('Success\nBook purchased successfully');
        this.cart.clear();
      },
      error: (e) => alert(e?.error?.error ?? 'Checkout failed'),
    });
  }
}

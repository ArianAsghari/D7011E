import { Component, inject, OnInit, DoCheck, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService, Order } from '../../services/orders';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrdersComponent implements OnInit, DoCheck {
  private ordersApi = inject(OrdersService);
  private cdr = inject(ChangeDetectorRef);

  orders: Order[] = [];
  private hasLoaded = false;
  private checkCount = 0;

  ngOnInit() {
    console.log('ngOnInit - initial load');
    this.loadOrders();
  }

  ngDoCheck() {
    this.checkCount++;
    console.log(`ngDoCheck #${this.checkCount} - hasLoaded: ${this.hasLoaded}, orders: ${this.orders.length}`);
    
    // If we haven't loaded data yet, try loading on every check
    if (!this.hasLoaded && this.checkCount > 1) {
      console.log('Attempting load in ngDoCheck');
      this.loadOrders();
    }
    
    // Force another check after a delay
    if (this.checkCount === 1) {
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    }
  }

  loadOrders() {
    console.log('loadOrders called');
    this.ordersApi.mine().subscribe({
      next: (o: Order[]) => {
        console.log('Success! Orders:', o);
        this.orders = o || [];
        this.hasLoaded = true;
        this.cdr.detectChanges(); // Force update
      },
      error: (err) => {
        console.error('Error:', err);
      }
    });
  }
}
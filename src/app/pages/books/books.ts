import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BooksService, Book } from '../../services/books';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './books.html',
  styleUrl: './books.css',
})
export class BooksComponent {
  private api = inject(BooksService);
  private cart = inject(CartService);

  books: Book[] = [];
  q = '';
  qty: Record<number, number> = {};

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.list(this.q).subscribe((data) => {
      this.books = data;
      for (const b of data) if (!this.qty[b.id]) this.qty[b.id] = 1;
    });
  }

  add(b: Book) {
    this.cart.add(b, this.qty[b.id] ?? 1);
    alert('Book added to cart successfully');
  }
}

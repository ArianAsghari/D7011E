import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BooksService, Book } from '../../services/books';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './book-details.html',
  styleUrl: './book-details.css',
})
export class BookDetailsComponent {
  private route = inject(ActivatedRoute);
  private api = inject(BooksService);
  private cart = inject(CartService);

  book: Book | null = null;
  qty = 1;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.get(id).subscribe((b) => (this.book = b));
  }

  add() {
    if (!this.book) return;
    this.cart.add(this.book, this.qty);
    alert('Book added to cart successfully');
  }
}

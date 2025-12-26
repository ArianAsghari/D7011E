import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BooksService, Book } from '../../services/books';
import { CartService } from '../../services/cart';
import { ChangeDetectorRef } from '@angular/core';  

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './books.html',
  styleUrl: './books.css',
})
export class BooksComponent implements OnInit {
  private api = inject(BooksService);
  private cart = inject(CartService);
  private cdr = inject(ChangeDetectorRef);  

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
      
      this.cdr.detectChanges(); 
    });
  }

  add(b: Book) {
    this.cart.add(b, this.qty[b.id] ?? 1);
    alert('Book added to cart successfully');
  }
}
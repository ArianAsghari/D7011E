import { Component, inject, OnInit, DoCheck, ChangeDetectorRef } from '@angular/core';
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
export class BookDetailsComponent implements OnInit, DoCheck {
  private route = inject(ActivatedRoute);
  private api = inject(BooksService);
  private cart = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  book: Book | null = null;
  qty = 1;
  
  private hasLoaded = false;
  private checkCount = 0;

  ngOnInit() {
    console.log('BookDetailsComponent - ngOnInit');
    this.loadBook();
  }

  ngDoCheck() {
    this.checkCount++;
    console.log(`BookDetailsComponent - ngDoCheck #${this.checkCount}`);
    
    // If we haven't loaded data yet, try loading on every check
    if (!this.hasLoaded && this.checkCount > 1) {
      console.log('Attempting load in ngDoCheck');
      this.loadBook();
    }
    
    // Force another check after a delay
    if (this.checkCount === 1) {
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    }
  }

  loadBook() {
    console.log('loadBook() called');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Book ID from route:', id);
    
    if (!id || isNaN(id)) {
      console.error('Invalid book ID:', id);
      return;
    }

    this.api.get(id).subscribe({
      next: (b) => {
        console.log('Book loaded successfully:', b);
        this.book = b;
        this.hasLoaded = true;
        this.cdr.detectChanges(); // Force update
      },
      error: (err) => {
        console.error('Error loading book:', err);
        this.hasLoaded = true;
      }
    });
  }

  add() {
    if (!this.book) {
      console.error('Cannot add to cart: book is null');
      return;
    }
    
    console.log(`Adding ${this.qty} of "${this.book.name}" to cart`);
    this.cart.add(this.book, this.qty);
    alert('Book added to cart successfully');
  }
}
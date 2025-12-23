import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BooksService, Book } from './services/books';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Books</h2>

    <input [(ngModel)]="q" placeholder="Search..." />
    <button (click)="load()">Search</button>

    <div *ngFor="let b of books" style="border:1px solid #ddd; padding:10px; margin:10px 0;">
      <b>{{ b.name }}</b> — {{ b.author }} <br />
      Price: {{ b.price }} | Stock: {{ b.stock }}
      <p>{{ b.description }}</p>
    </div>
  `
})
export class AppComponent {
  private api = inject(BooksService);
  books: Book[] = [];
  q = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getBooks(this.q).subscribe(data => this.books = data);
  }
}

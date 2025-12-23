import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BooksService, Book } from '../../services/books';

@Component({
  selector: 'app-manager-book-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manager-book-list.html',
  styleUrl: './manager-book-list.css',
})
export class ManagerBookListComponent {
  private api = inject(BooksService);
  books: Book[] = [];

  ngOnInit() {
    this.api.list().subscribe((b) => (this.books = b));
  }

  del(id: number) {
    if (!confirm('Delete book?')) return;
    this.api.delete(id).subscribe({
      next: () => (this.books = this.books.filter((x) => x.id !== id)),
      error: (e) => alert(e?.error?.error ?? 'Delete failed'),
    });
  }
}

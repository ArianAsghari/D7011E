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
  err = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.err = '';
    this.api.list().subscribe({
      next: (rows) => (this.books = rows),
      error: (e: any) => (this.err = e?.error?.error ?? 'Load failed'),
    });
  }

  del(id: number) {
    if (!confirm('Delete book?')) return;

    this.api.remove(id).subscribe({
      next: () => this.load(),
      error: (e: any) => alert(e?.error?.error ?? 'Delete failed'),
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BooksService, BookCreate } from '../../services/books';

@Component({
  selector: 'app-manager-book-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manager-book-create.html',
  styleUrl: './manager-book-create.css',
})
export class ManagerBookCreateComponent {
  private api = inject(BooksService);
  private router = inject(Router);

  book: BookCreate = {
    name: '',
    author: '',
    description: '',
    year: null,
    language: null,
    price: 0,
    stock: 0,
    image_id: null,
  };

  msg = '';
  err = '';

  save() {
    this.msg = '';
    this.err = '';

    // enkel frontend-validering
    if (!this.book.name.trim() || !this.book.author.trim()) {
      this.err = 'Name and Author are required';
      return;
    }

    this.api.create(this.book).subscribe({
      next: () => {
        this.msg = 'Book created';
        this.router.navigateByUrl('/manager/books');
      },
      error: (e: any) => {
        this.err = e?.error?.error ?? 'Create failed';
      },
    });
  }
}

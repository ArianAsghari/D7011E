import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BooksService, Book } from '../../services/books';

@Component({
  selector: 'app-manager-book-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manager-book-edit.html',
  styleUrl: './manager-book-edit.css',
})
export class ManagerBookEditComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(BooksService);

  id = 0;
  book: Book | null = null;
  err = '';
  msg = '';

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.get(this.id).subscribe({
      next: (b) => (this.book = b),
      error: () => (this.err = 'Book not found'),
    });
  }

  save() {
    if (!this.book) return;
    this.err = '';
    this.msg = '';

    this.api.update(this.id, this.book).subscribe({
      next: () => {
        this.msg = 'Updated';
        this.router.navigateByUrl('/manager/books');
      },
      error: (e) => (this.err = e?.error?.error ?? 'Update failed'),
    });
  }
}

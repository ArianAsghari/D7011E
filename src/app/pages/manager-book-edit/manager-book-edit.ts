import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BooksService, Book, BookUpdate } from '../../services/books';

@Component({
  selector: 'app-manager-book-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manager-book-edit.html',
  styleUrl: './manager-book-edit.css',
})
export class ManagerBookEditComponent {
  private api = inject(BooksService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  book: Book | null = null;
  loading = false;
  msg = '';
  err = '';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.err = 'Bad book id in URL';
      return;
    }
    this.load(id);
  }

  private load(id: number) {
    this.msg = '';
    this.err = '';
    this.loading = true;

    this.api.get(id).subscribe({
      next: (b) => {
        this.book = b;
        this.loading = false;
      },
      error: (e: any) => {
        this.err = e?.error?.error ?? `Load failed (${e?.status ?? 'no status'})`;
        this.loading = false;
      },
    });
  }

  save() {
    if (!this.book) return;

    this.msg = '';
    this.err = '';

    const id = this.book.id;

    const payload: BookUpdate = {
      name: this.book.name,
      author: this.book.author,
      description: this.book.description ?? '',
      stock: Number(this.book.stock ?? 0),
      price: Number(this.book.price ?? 0),
      year: this.book.year ?? null,
      language: this.book.language ?? null,
      image_id: this.book.image_id ?? null,
    };

    this.api.update(id, payload).subscribe({
      next: () => {
        this.msg = 'Updated';
        this.router.navigateByUrl('/manager/books');
      },
      error: (e: any) => (this.err = e?.error?.error ?? 'Update failed'),
    });
  }
}

import { Injectable, signal } from '@angular/core';
import { Book } from './books';

export type CartItem = { book: Book; quantity: number };

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);
  items = this._items.asReadonly();

  add(book: Book, qty: number) {
    const quantity = Math.max(1, Math.floor(qty));
    const items = [...this._items()];
    const idx = items.findIndex((i) => i.book.id === book.id);

    if (idx >= 0) items[idx] = { book, quantity: items[idx].quantity + quantity };
    else items.push({ book, quantity });

    this._items.set(items);
  }

  remove(bookId: number) {
    this._items.set(this._items().filter((i) => i.book.id !== bookId));
  }

  clear() {
    this._items.set([]);
  }

  total(): number {
    return this._items().reduce((sum, i) => sum + i.book.price * i.quantity, 0);
  }

  // BACKEND expects: { book_id, quantity }
  toOrderItems(): { book_id: number; quantity: number }[] {
    return this._items().map((i) => ({
      book_id: i.book.id,
      quantity: i.quantity,
    }));
  }
}

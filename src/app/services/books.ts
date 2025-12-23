import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Book = {
  id: number;
  name: string;
  author: string;
  description?: string;
  language?: string;
  year?: number;
  price: number;
  stock: number;
  image_url?: string | null;
};

@Injectable({ providedIn: 'root' })
export class BooksService {
  private api = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getBooks(search?: string): Observable<Book[]> {
    const q = search?.trim();
    const url = q ? `${this.api}/books?search=${encodeURIComponent(q)}` : `${this.api}/books`;
    return this.http.get<Book[]>(url);
  }
}

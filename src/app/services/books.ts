import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Book = {
  id: number;
  name: string;
  author: string;
  description: string;
  language: string | null;
  year: number | null;
  price: number;
  stock: number;
  image_id: number | null;
  image_url?: string | null;
};

export type BookCreate = {
  name: string;
  author: string;
  description: string;
  language: string | null;
  year: number | null;
  price: number;
  stock: number;
  image_id: number | null;
};

export type BookUpdate = {
  name: string;
  author: string;
  description: string;
  language: string | null;
  year: number | null;
  price: number;
  stock: number;
  image_id: number | null;
};

@Injectable({ providedIn: 'root' })
export class BooksService {
  private api = 'http://localhost:8080/api/books';

  constructor(private http: HttpClient) {}

  list(search?: string): Observable<Book[]> {
    const q = search?.trim();
    const url = q ? `${this.api}?search=${encodeURIComponent(q)}` : this.api;
    return this.http.get<Book[]>(url);
  }

  get(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.api}/${id}`);
  }

  create(body: BookCreate): Observable<Book> {
    return this.http.post<Book>(this.api, body);
  }

  update(id: number, body: BookUpdate): Observable<Book> {
    return this.http.put<Book>(`${this.api}/${id}`, body);
  }

  remove(id: number): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.api}/${id}`);
  }

  // alias om du vill skriva this.api.delete(id)
  delete(id: number) {
    return this.remove(id);
  }
}

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { BooksService, Book } from '../../services/books';

@Component({
  selector: 'app-manager-book-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manager-book-list.html',
  styleUrls: ['./manager-book-list.css'],
})
export class ManagerBookListComponent implements OnInit {
  private api = inject(BooksService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  books: Book[] = [];
  err = '';
  isLoading = false;
  private hasInitialized = false;

  ngOnInit() {
    console.log(' Book List Component INIT');
    
    // Load books immediately
    this.loadBooks();
    
    // Listen for navigation events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        console.log(' Navigation to:', event.url);
        
        // If we're on the book list page, reload
        if (event.url.includes('/manager/books')) {
          console.log(' Reloading due to navigation');
          this.loadBooks();
        }
      });
  }

  loadBooks() {
    console.log('🔄 Loading books...');
    this.isLoading = true;
    this.err = '';
    
    this.api.list().subscribe({
      next: (rows) => {
        console.log(' Books loaded:', rows.length);
        this.books = [...rows]; // Create NEW array reference
        this.isLoading = false;
        this.hasInitialized = true;
        
        //  FORCE CHANGE DETECTION
        this.cdr.detectChanges();
        
        // Force another update after a tick
        setTimeout(() => {
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        console.error(' Error loading books:', e);
        this.err = e?.error?.error ?? 'Load failed';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  del(id: number) {
    if (!confirm('Delete book?')) return;

    console.log(' Deleting book ID:', id);
    
    this.api.remove(id).subscribe({
      next: () => {
        console.log(' Book deleted, refreshing list...');
        
        // Method 1: Reload all books
        this.loadBooks();
        
        // OR Method 2: Remove from local array (faster)
        // this.removeBookFromList(id);
      },
      error: (e: any) => {
        console.error(' Delete failed:', e);
        alert(e?.error?.error ?? 'Delete failed');
        this.cdr.detectChanges();
      },
    });
  }

  // Alternative: Remove from local array without reloading all
  private removeBookFromList(id: number) {
    const index = this.books.findIndex(book => book.id === id);
    if (index !== -1) {
      // Create NEW array (important for change detection)
      this.books = [
        ...this.books.slice(0, index),
        ...this.books.slice(index + 1)
      ];
      
      // Force change detection
      this.cdr.detectChanges();
      console.log(' Book removed from local array');
    }
  }

  // Manual refresh button
  refresh() {
    console.log(' Manual refresh triggered');
    this.loadBooks();
  }
}
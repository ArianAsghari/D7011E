import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './services/auth';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'books' },

  // Public
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent),
  },

  // Customer
  {
    path: 'books',
    loadComponent: () => import('./pages/books/books').then(m => m.BooksComponent),
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./pages/book-details/book-details').then(m => m.BookDetailsComponent),
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cart/cart').then(m => m.CartComponent),
  },
  {
    path: 'my-orders',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-orders/my-orders').then(m => m.MyOrdersComponent),
  },

  // Manager (EMPLOYEE)
  {
    path: 'manager/books',
    canActivate: [authGuard, roleGuard('EMPLOYEE', 'ADMIN')],
    loadComponent: () => import('./pages/manager-book-list/manager-book-list').then(m => m.ManagerBookListComponent),
  },
  {
    path: 'manager/books/:id/edit',
    canActivate: [authGuard, roleGuard('EMPLOYEE', 'ADMIN')],
    loadComponent: () => import('./pages/manager-book-edit/manager-book-edit').then(m => m.ManagerBookEditComponent),
  },

  // Admin
  {
    path: 'admin/create-user',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () => import('./pages/admin-create-user/admin-create-user').then(m => m.AdminCreateUserComponent),
  },

  { path: '**', redirectTo: 'books' },
];

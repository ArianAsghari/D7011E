// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './services/auth';

import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { BooksComponent } from './pages/books/books';
import { BookDetailsComponent } from './pages/book-details/book-details';
import { CartComponent } from './pages/cart/cart';
import { MyOrdersComponent } from './pages/my-orders/my-orders';

import { AdminCreateUserComponent } from './pages/admin-create-user/admin-create-user';
import { ManagerBookListComponent } from './pages/manager-book-list/manager-book-list';
import { ManagerBookEditComponent } from './pages/manager-book-edit/manager-book-edit';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'books' },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'books', component: BooksComponent },
  { path: 'books/:id', component: BookDetailsComponent },

  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'my-orders', component: MyOrdersComponent, canActivate: [authGuard] },

  {
    path: 'admin/create-user',
    component: AdminCreateUserComponent,
    canActivate: [authGuard, roleGuard('ADMIN')],
  },

  {
    path: 'manager/books',
    component: ManagerBookListComponent,
    canActivate: [authGuard, roleGuard('EMPLOYEE', 'ADMIN')],
  },
  {
    path: 'manager/books/:id/edit',
    component: ManagerBookEditComponent,
    canActivate: [authGuard, roleGuard('EMPLOYEE', 'ADMIN')],
  },

  { path: '**', redirectTo: 'books' },
];

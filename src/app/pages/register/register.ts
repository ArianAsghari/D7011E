import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, Role } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Must match register.html bindings
  email = '';
  name = '';
  password = '';
  confirm = '';
  role: Role = 'CUSTOMER';

  msg = '';
  err = '';
  loading = false;

  submit() {
    this.msg = '';
    this.err = '';

    const email = this.email.trim();
    const name = this.name.trim();
    const p1 = this.password;
    const p2 = this.confirm;

    if (!email || !name || !p1 || !p2) {
      this.err = 'Fill in all fields';
      return;
    }
    if (p1 !== p2) {
      this.err = 'Passwords do not match';
      return;
    }
    if (p1.length < 6) {
      this.err = 'Password must be at least 6 characters';
      return;
    }

    // Optional safety: only allow CUSTOMER from UI (grade requirement)
    // to allow admin to select roles, remove these two lines.
    this.role = 'CUSTOMER';

    this.loading = true;

    this.auth.register(email, p1, name, this.role).subscribe({
      next: () => {
        this.loading = false;
        this.msg = 'Registered. Please login.';
        this.router.navigateByUrl('/login');
      },
      error: (e: unknown) => {
        this.loading = false;
        const errObj = e as any;
        this.err =
          errObj?.error?.error ??
          errObj?.error?.message ??
          errObj?.message ??
          'Register failed';
      },
    });
  }
}

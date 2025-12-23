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

  email = '';
  password = '';
  confirm = '';
  name = 'customer';
  role: Role = 'CUSTOMER';
  msg = '';
  err = '';

  submit() {
    this.msg = '';
    this.err = '';

    if (!this.email || !this.password) {
      this.err = 'Email + password required';
      return;
    }
    if (this.password !== this.confirm) {
      this.err = 'Passwords do not match';
      return;
    }

    this.auth.register(this.email, this.password, this.name, this.role).subscribe({
      next: () => {
        this.msg = 'Registered. Please login.';
        this.router.navigateByUrl('/login');
      },
      error: (e) => (this.err = e?.error?.error ?? 'Register failed'),
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, Role } from '../../services/auth';

@Component({
  selector: 'app-admin-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-create-user.html',
  styleUrl: './admin-create-user.css',
})
export class AdminCreateUserComponent {
  private auth = inject(AuthService);

  email = '';
  password = '';
  name = '';
  role: Role = 'EMPLOYEE';

  ok = '';
  err = '';

  submit() {
    this.ok = '';
    this.err = '';

    this.auth.adminCreateUser(this.email, this.password, this.name, this.role).subscribe({
      next: () => (this.ok = 'User created'),
      error: (e) => (this.err = e?.error?.error ?? 'Create user failed'),
    });
  }
}

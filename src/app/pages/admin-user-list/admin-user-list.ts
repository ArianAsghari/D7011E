import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, Role } from '../../services/auth';

type UserRow = {
  id: number;
  email: string;
  name: string;
  role: Role;

  // UI-only fields for editing
  _editName?: string;
  _editRole?: Role;
};

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user-list.html',
  styleUrl: './admin-user-list.css',
})
export class AdminUserListComponent {
  private auth = inject(AuthService);

  users: UserRow[] = [];
  loading = false;

  ok = '';
  err = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.ok = '';
    this.err = '';
    this.loading = true;

    this.auth.adminListUsers().subscribe({
      next: (rows: any[]) => {
        this.users = (rows || []).map((u: any) => ({
          id: Number(u.id),
          email: String(u.email),
          name: String(u.name),
          role: u.role as Role,
          _editName: String(u.name),
          _editRole: u.role as Role,
        }));
        this.loading = false;
      },
      error: (e) => {
        this.err = e?.error?.error ?? 'Could not load users';
        this.loading = false;
      },
    });
  }

  save(u: UserRow) {
    this.ok = '';
    this.err = '';

    const name = (u._editName ?? u.name).toString().trim();
    const role = (u._editRole ?? u.role) as Role;

    if (!name) {
      this.err = 'Name is required';
      return;
    }

    this.auth.adminUpdateUser(u.id, name, role).subscribe({
      next: (updated: any) => {
        u.name = updated.name;
        u.role = updated.role;
        u._editName = updated.name;
        u._editRole = updated.role;
        this.ok = `Updated user #${u.id}`;
      },
      error: (e) => {
        this.err = e?.error?.error ?? 'Update failed';
      },
    });
  }

  remove(u: UserRow) {
    this.ok = '';
    this.err = '';

    if (!confirm(`Delete user "${u.email}" (id ${u.id})?`)) return;

    this.auth.adminDeleteUser(u.id).subscribe({
      next: () => {
        this.users = this.users.filter((x) => x.id !== u.id);
        this.ok = `Deleted user #${u.id}`;
      },
      error: (e) => {
        this.err = e?.error?.error ?? 'Delete failed';
      },
    });
  }
}

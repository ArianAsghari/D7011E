import { Component, inject, OnInit, DoCheck, ChangeDetectorRef } from '@angular/core';
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
export class AdminUserListComponent implements OnInit, DoCheck {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  users: UserRow[] = [];
  loading = false;

  ok = '';
  err = '';
  
  private hasLoaded = false;
  private checkCount = 0;

  ngOnInit() {
    console.log('AdminUserListComponent - ngOnInit');
    this.load();
  }

  ngDoCheck() {
    this.checkCount++;
    console.log(`AdminUserListComponent - ngDoCheck #${this.checkCount}`);
    
    // If we haven't loaded data yet, try loading on every check
    if (!this.hasLoaded && this.checkCount > 1) {
      console.log('Attempting load in ngDoCheck');
      this.load();
    }
    
    // Force another check after a delay
    if (this.checkCount === 1) {
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    }
  }

  load() {
    console.log('load() called');
    this.ok = '';
    this.err = '';
    this.loading = true;

    this.auth.adminListUsers().subscribe({
      next: (rows: any[]) => {
        console.log('Users loaded:', rows?.length || 0, 'items');
        this.users = (rows || []).map((u: any) => ({
          id: Number(u.id),
          email: String(u.email),
          name: String(u.name),
          role: u.role as Role,
          _editName: String(u.name),
          _editRole: u.role as Role,
        }));
        this.loading = false;
        this.hasLoaded = true;
        this.cdr.detectChanges(); // Force update
      },
      error: (e) => {
        console.error('Load error:', e);
        this.err = e?.error?.error ?? 'Could not load users';
        this.loading = false;
        this.hasLoaded = true;
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
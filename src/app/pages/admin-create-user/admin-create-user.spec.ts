import { TestBed } from '@angular/core/testing';
import { AdminCreateUserComponent } from './admin-create-user';

describe('AdminCreateUserComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateUserComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminCreateUserComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

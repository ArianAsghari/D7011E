import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateUser } from './admin-create-user';

describe('AdminCreateUser', () => {
  let component: AdminCreateUser;
  let fixture: ComponentFixture<AdminCreateUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCreateUser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

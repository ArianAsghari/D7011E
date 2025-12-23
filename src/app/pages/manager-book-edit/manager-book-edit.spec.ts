import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerBookEdit } from './manager-book-edit';

describe('ManagerBookEdit', () => {
  let component: ManagerBookEdit;
  let fixture: ComponentFixture<ManagerBookEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerBookEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerBookEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

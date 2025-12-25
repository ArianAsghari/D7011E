import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerBookCreate } from './manager-book-create';

describe('ManagerBookCreate', () => {
  let component: ManagerBookCreate;
  let fixture: ComponentFixture<ManagerBookCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerBookCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerBookCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

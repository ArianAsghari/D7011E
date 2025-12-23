import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerBookList } from './manager-book-list';

describe('ManagerBookList', () => {
  let component: ManagerBookList;
  let fixture: ComponentFixture<ManagerBookList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerBookList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerBookList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

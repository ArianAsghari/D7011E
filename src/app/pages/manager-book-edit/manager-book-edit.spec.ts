import { TestBed } from '@angular/core/testing';
import { ManagerBookEditComponent } from './manager-book-edit';

describe('ManagerBookEditComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerBookEditComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ManagerBookEditComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

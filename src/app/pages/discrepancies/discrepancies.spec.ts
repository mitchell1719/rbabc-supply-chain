import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Discrepancies } from './discrepancies';

describe('Discrepancies', () => {
  let component: Discrepancies;
  let fixture: ComponentFixture<Discrepancies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Discrepancies],
    }).compileComponents();

    fixture = TestBed.createComponent(Discrepancies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

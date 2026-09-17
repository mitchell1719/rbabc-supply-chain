import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HqConsolidation } from './hq-consolidation';

describe('HqConsolidation', () => {
  let component: HqConsolidation;
  let fixture: ComponentFixture<HqConsolidation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HqConsolidation],
    }).compileComponents();

    fixture = TestBed.createComponent(HqConsolidation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

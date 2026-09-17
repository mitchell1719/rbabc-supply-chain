import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PurchaseRequests } from './purchase-requests';

describe('PurchaseRequests', () => {
  let component: PurchaseRequests;
  let fixture: ComponentFixture<PurchaseRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

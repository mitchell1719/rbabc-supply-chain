import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewPurchaseRequest } from './new-purchase-request';

describe('NewPurchaseRequest', () => {
  let component: NewPurchaseRequest;
  let fixture: ComponentFixture<NewPurchaseRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPurchaseRequest],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPurchaseRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

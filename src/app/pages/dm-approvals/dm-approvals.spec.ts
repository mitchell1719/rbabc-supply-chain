import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DmApprovals } from './dm-approvals';

describe('DmApprovals', () => {
  let component: DmApprovals;
  let fixture: ComponentFixture<DmApprovals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DmApprovals],
    }).compileComponents();

    fixture = TestBed.createComponent(DmApprovals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

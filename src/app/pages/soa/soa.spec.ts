import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Soa } from './soa';

describe('Soa', () => {
  let component: Soa;
  let fixture: ComponentFixture<Soa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Soa],
    }).compileComponents();

    fixture = TestBed.createComponent(Soa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

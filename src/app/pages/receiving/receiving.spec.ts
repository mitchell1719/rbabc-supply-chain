import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Receiving } from './receiving';

describe('Receiving', () => {
  let component: Receiving;
  let fixture: ComponentFixture<Receiving>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Receiving],
    }).compileComponents();

    fixture = TestBed.createComponent(Receiving);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Prs } from './prs';

describe('Prs', () => {
  let component: Prs;
  let fixture: ComponentFixture<Prs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prs],
    }).compileComponents();

    fixture = TestBed.createComponent(Prs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

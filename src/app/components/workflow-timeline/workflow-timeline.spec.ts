import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowTimeline } from './workflow-timeline';

describe('WorkflowTimeline', () => {
  let component: WorkflowTimeline;
  let fixture: ComponentFixture<WorkflowTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowTimeline],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowTimeline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

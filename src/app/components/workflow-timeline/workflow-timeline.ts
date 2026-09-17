import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  WorkflowHistory
} from '../../models/supply-chain.model';

@Component({
  selector: 'app-workflow-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workflow-timeline.html',
  styleUrl: './workflow-timeline.css'
})
export class WorkflowTimeline {

  @Input()
  history: WorkflowHistory[] = [];

}
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.html',
  styleUrl: './loading-skeleton.css',
})
export class LoadingSkeleton {
  @Input() rows = 5;
  @Input() label = 'Loading data…';

  get rowArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';

import { CommonModule } from '@angular/common';

/**
 * Wraps the standard loading / error / empty / content states used when
 * fetching a collection from Firestore, so every tab renders the same
 * feedback instead of each page re-implementing its own ngIf trio.
 */
@Component({
  selector: 'app-data-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-state.html',
  styleUrl: './data-state.css',
})
export class DataState {
  @Input() loading = false;

  @Input() error = '';

  @Input() isEmpty = false;

  @Input() emptyMessage = 'No records found.';

  @Input() loadingMessage = 'Loading...';

  @Output() retry = new EventEmitter<void>();
}

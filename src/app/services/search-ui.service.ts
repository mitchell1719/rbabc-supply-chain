import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SearchUiService {
  readonly open = signal(false);

  show(): void {
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }
}

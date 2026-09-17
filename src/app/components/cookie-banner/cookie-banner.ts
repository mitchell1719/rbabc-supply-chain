import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

const STORAGE_KEY = 'rbabc-cookie-consent';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.css',
})
export class CookieBanner {
  readonly visible = signal(this.shouldShow());

  accept(): void {
    this.store('accepted');
  }

  decline(): void {
    this.store('declined');
  }

  private store(value: 'accepted' | 'declined'): void {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore storage errors
    }

    this.visible.set(false);
  }

  private shouldShow(): boolean {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  }
}

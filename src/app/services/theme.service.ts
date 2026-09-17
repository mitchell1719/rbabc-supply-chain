import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'rbabc-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly isDark = signal<boolean>(this.resolveInitialTheme());

  constructor() {
    this.applyTheme(this.isDark());
  }

  toggle(): void {
    this.setTheme(!this.isDark());
  }

  setTheme(dark: boolean): void {
    this.isDark.set(dark);
    this.applyTheme(dark);

    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // localStorage unavailable (private mode, etc.) - theme just won't persist.
    }
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  private resolveInitialTheme(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored === 'dark') return true;
      if (stored === 'light') return false;
    } catch {
      // ignore
    }

    return typeof window !== 'undefined' && !!window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  }
}

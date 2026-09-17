import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-copy-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.css',
})
export class CopyButton {
  @Input() value = '';
  @Input() label = 'Copy';

  readonly copied = signal(false);

  async copy(event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!this.value) return;

    try {
      await navigator.clipboard.writeText(this.value);
    } catch {
      this.fallbackCopy(this.value);
    }

    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  private fallbackCopy(value: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
    } catch {
      // Clipboard unavailable - nothing more we can do.
    }

    document.body.removeChild(textarea);
  }
}

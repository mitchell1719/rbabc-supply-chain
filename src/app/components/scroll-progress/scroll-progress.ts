import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-scroll-progress',
  standalone: true,
  imports: [],
  templateUrl: './scroll-progress.html',
  styleUrl: './scroll-progress.css',
})
export class ScrollProgress {
  readonly progress = signal(0);

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    this.progress.set(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
  }
}

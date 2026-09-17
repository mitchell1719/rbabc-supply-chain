import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SearchResult, SearchService } from '../../services/search.service';
import { SearchUiService } from '../../services/search-ui.service';

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-overlay.html',
  styleUrl: './search-overlay.css',
})
export class SearchOverlay {
  readonly loading = signal(false);
  readonly results = signal<SearchResult[]>([]);

  term = '';

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private searchService: SearchService,
    private router: Router,
    public searchUi: SearchUiService,
  ) {}

  get open() {
    return this.searchUi.open;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

    if (isShortcut) {
      event.preventDefault();
      this.show();
      return;
    }

    if (event.key === 'Escape' && this.open()) {
      this.close();
    }
  }

  show(): void {
    this.searchUi.show();
  }

  close(): void {
    this.searchUi.close();
    this.term = '';
    this.results.set([]);
  }

  onTermChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    const value = this.term;

    this.searchTimer = setTimeout(() => this.runSearch(value), 220);
  }

  private async runSearch(term: string): Promise<void> {
    if (!term.trim()) {
      this.results.set([]);
      return;
    }

    this.loading.set(true);

    try {
      const results = await this.searchService.search(term);
      this.results.set(results);
    } catch (error) {
      console.error('SEARCH ERROR:', error);
      this.results.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  goTo(result: SearchResult): void {
    this.router.navigate(result.route);
    this.close();
  }

  get groupedResults(): { category: string; items: SearchResult[] }[] {
    const groups = new Map<string, SearchResult[]>();

    for (const result of this.results()) {
      const list = groups.get(result.category) ?? [];
      list.push(result);
      groups.set(result.category, list);
    }

    return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
  }
}

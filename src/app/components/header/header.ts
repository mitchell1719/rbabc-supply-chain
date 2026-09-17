import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { SearchUiService } from '../../services/search-ui.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  @Output()
  menuToggle = new EventEmitter<void>();

  constructor(
    public theme: ThemeService,
    public searchUi: SearchUiService,

    private auth: AuthService,

    private router: Router
  ) {}

  get user() {
    return this.auth.user();
  }

  get initials(): string {
    const name = this.auth.displayName();

    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async logOut() {
    await this.auth.logOut();

    this.router.navigate(['/login']);
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  onSearchClick(): void {
    this.searchUi.show();
  }
}

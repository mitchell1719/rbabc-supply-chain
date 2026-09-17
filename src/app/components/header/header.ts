import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThemeService } from '../../services/theme.service';
import { SearchUiService } from '../../services/search-ui.service';

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
  ) {}

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  onSearchClick(): void {
    this.searchUi.show();
  }
}

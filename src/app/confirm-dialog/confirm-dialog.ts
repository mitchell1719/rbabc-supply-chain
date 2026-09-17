import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  constructor(public confirmService: ConfirmService) {}

  respond(result: boolean): void {
    this.confirmService.respond(result);
  }
}

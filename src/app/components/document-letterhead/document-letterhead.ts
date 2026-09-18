import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Shared RB-ABC letterhead for printable documents (PRS, Delivery Note, ...). */
@Component({
  selector: 'app-document-letterhead',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-letterhead.html',
  styleUrl: './document-letterhead.css',
})
export class DocumentLetterhead {
  @Input() title = '';
  @Input() subtitle = '';
}

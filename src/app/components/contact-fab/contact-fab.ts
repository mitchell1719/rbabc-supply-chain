import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SupplyChainService } from '../../services/supply-chain.service';

@Component({
  selector: 'app-contact-fab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-fab.html',
  styleUrl: './contact-fab.css',
})
export class ContactFab {
  readonly open = signal(false);
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly errorMessage = signal('');

  name = '';
  email = '';
  message = '';

  constructor(private service: SupplyChainService) {}

  toggle(): void {
    this.open.update((value) => !value);

    if (!this.open()) {
      this.errorMessage.set('');
    }
  }

  close(): void {
    this.open.set(false);
  }

  async send(): Promise<void> {
    this.errorMessage.set('');

    if (!this.name.trim() || !this.message.trim()) {
      this.errorMessage.set('Please enter your name and a message.');
      return;
    }

    this.sending.set(true);

    try {
      await this.service.submitContactMessage({
        name: this.name.trim(),
        email: this.email.trim(),
        message: this.message.trim(),
      });

      this.sent.set(true);
      this.name = '';
      this.email = '';
      this.message = '';
    } catch (error) {
      console.error('CONTACT SUBMIT ERROR:', error);
      this.errorMessage.set('Unable to send your message right now. Please try again.');
    } finally {
      this.sending.set(false);
    }
  }

  reset(): void {
    this.sent.set(false);
    this.open.set(false);
  }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SupplyChainService } from '../services/supply-chain.service';
import { UtmLinkDirective } from '../directives/utm-link.directive';

interface FaqEntry {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-rb-help',
  standalone: true,
  imports: [CommonModule, FormsModule, UtmLinkDirective],
  templateUrl: './rb-help.html',
  styleUrl: './rb-help.css',
})
export class Help {
  faqs: FaqEntry[] = [
    {
      question: 'How do I submit a new Purchase Request?',
      answer:
        'Go to Purchase Requests → "+ New Purchase Request", select the branch, fill in the requested items, and submit. This automatically routes the request to the assigned District Manager for approval.',
      open: true,
    },
    {
      question: 'What happens after a District Manager approves a request?',
      answer:
        'DM-approved requests move to HQ Consolidation, where the assigned headquarters groups requests before generating a Purchase Requisition Slip (PRS).',
      open: false,
    },
    {
      question: 'How do I record a delivery discrepancy?',
      answer:
        'On the Receiving Reports page, check "There is a discrepancy" and describe the issue. The report is filed under Discrepancies until a Supply Chain Officer resolves it.',
      open: false,
    },
    {
      question: 'Why can\'t I generate a PRS for a request?',
      answer:
        'A Purchase Request must be HQ-consolidated before a PRS can be generated. Check the request\'s status on its details page.',
      open: false,
    },
    {
      question: 'How do I switch to dark mode?',
      answer:
        'Use the sun/moon toggle in the top header. Your preference is saved on this device and will persist across visits.',
      open: false,
    },
    {
      question: 'Who do I contact for access issues?',
      answer:
        'Use the floating "Need help?" button in the bottom-right corner of any page, or email the Supply Chain Office directly.',
      open: false,
    },
  ];

  readonly newsletterEmail = signal('');
  readonly subscribing = signal(false);
  readonly subscribed = signal(false);
  readonly newsletterError = signal('');

  constructor(private service: SupplyChainService) {}

  toggleFaq(faq: FaqEntry): void {
    faq.open = !faq.open;
  }

  async subscribe(): Promise<void> {
    this.newsletterError.set('');

    const email = this.newsletterEmail().trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.newsletterError.set('Please enter a valid email address.');
      return;
    }

    this.subscribing.set(true);

    try {
      await this.service.subscribeNewsletter(email);
      this.subscribed.set(true);
    } catch (error) {
      console.error('NEWSLETTER SUBSCRIBE ERROR:', error);
      this.newsletterError.set('Unable to subscribe right now. Please try again.');
    } finally {
      this.subscribing.set(false);
    }
  }
}

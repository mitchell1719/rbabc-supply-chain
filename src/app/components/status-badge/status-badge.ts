import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css'
})
export class StatusBadge {

  @Input() status = '';

  get statusClass(): string {

    switch (this.status) {

      case 'COMPLETED':
      case 'RECEIVED':
      case 'DM_APPROVED':
      case 'VERIFIED':
        return 'success';

      case 'PENDING_RNS_REVIEW':
      case 'PENDING_DM_APPROVAL':
      case 'FOR_PROCUREMENT':
      case 'FOR_DELIVERY':
      case 'RECEIVING_VERIFICATION':
        return 'warning';

      case 'DISCREPANCY':
      case 'CANCELLED':
        return 'danger';

      case 'RETURNED_FOR_REVISION':
        return 'returned';

      default:
        return 'info';
    }

  }

  get label(): string {
    return this.status.replaceAll('_', ' ');
  }

}
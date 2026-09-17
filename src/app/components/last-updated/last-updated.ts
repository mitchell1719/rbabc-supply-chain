import { Component, Input } from '@angular/core';

type TimestampLike =
  | { toDate: () => Date }
  | { seconds: number; nanoseconds?: number }
  | Date
  | string
  | number
  | null
  | undefined;

@Component({
  selector: 'app-last-updated',
  standalone: true,
  imports: [],
  templateUrl: './last-updated.html',
  styleUrl: './last-updated.css',
})
export class LastUpdated {
  @Input() date: TimestampLike = null;
  @Input() prefix = 'Updated';

  get resolvedDate(): Date | null {
    const value = this.date;

    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof (value as any).toDate === 'function') {
      return (value as any).toDate();
    }

    if (typeof (value as any).seconds === 'number') {
      return new Date((value as any).seconds * 1000);
    }

    return null;
  }

  get relative(): string {
    const date = this.resolvedDate;

    if (!date) return 'just now';

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);

    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;

    const diffMonth = Math.round(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth}mo ago`;

    const diffYear = Math.round(diffMonth / 12);
    return `${diffYear}y ago`;
  }

  get absolute(): string {
    const date = this.resolvedDate;

    if (!date) return 'No update recorded yet';

    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

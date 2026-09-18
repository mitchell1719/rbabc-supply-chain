import { Component, OnInit, computed, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuditService } from '../../services/audit.service';

import { AuditLogEntry } from '../../models/supply-chain.model';

import { DataState } from '../../components/data-state/data-state';
import { LastUpdated } from '../../components/last-updated/last-updated';

/** Read-only viewer over the auditLogs collection, for Supply Officer/Director oversight. */
@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, DataState, LastUpdated],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.css',
})
export class AuditLog implements OnInit {
  readonly logs = signal<AuditLogEntry[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  search = '';

  constructor(private audit: AuditService) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      this.logs.set(await this.audit.getRecentLogs());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load audit logs.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  get filtered(): AuditLogEntry[] {
    const keyword = this.search.trim().toLowerCase();

    const logs = this.logs();

    if (!keyword) {
      return logs;
    }

    return logs.filter(
      (entry) =>
        entry.userDisplayName?.toLowerCase().includes(keyword) ||
        entry.action?.toLowerCase().includes(keyword) ||
        entry.entityType?.toLowerCase().includes(keyword) ||
        entry.details?.toLowerCase().includes(keyword),
    );
  }

  get emptyMessage(): string {
    return this.search.trim() ? 'No audit entries match your search.' : 'No audited actions yet.';
  }
}

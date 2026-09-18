import { Injectable } from '@angular/core';

import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';

import { db } from '../config/firebase.config';

import { AuditLogEntry } from '../models/supply-chain.model';

/** The person performing an audited action. Passed explicitly rather than injecting AuthService, to avoid a DI cycle with UserService (AuthService -> UserService -> ... -> AuditService). */
export interface AuditActor {
  uid: string;
  displayName: string;
  role: string;
}

const MAX_LOGS = 300;

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  /**
   * Records one action. Failures are logged to the console and swallowed -
   * an audit-trail write must never block the primary action it's
   * documenting (e.g. a purchase request should still save even if the
   * audit log couldn't).
   */
  async log(actor: AuditActor, action: string, entityType: string, entityId: string, details = ''): Promise<void> {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        uid: actor.uid,
        userDisplayName: actor.displayName,
        role: actor.role,
        action,
        entityType,
        entityId,
        details,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }

  /** Most recent audit entries, for the Audit Log page. */
  async getRecentLogs(): Promise<AuditLogEntry[]> {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(MAX_LOGS));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as AuditLogEntry);
    } catch (error) {
      console.error('Load audit logs failed:', error);

      throw new Error('Unable to load audit logs. Please try again.');
    }
  }
}

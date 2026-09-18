import { Injectable } from '@angular/core';

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../config/firebase.config';

import {
  PurchaseRequest,
  RequestStatus,
  Branch,
  WorkflowHistory,
  PRS,
  Inventory,
  DeliveryNote,
  ReceivingReport,
  StatementOfAccount,
  Supplier,
  PurchaseOrder,
  SystemSettings,
  VaccineWastageEntry,
} from '../models/supply-chain.model';

import { REQUEST_TRANSITIONS } from '../config/workflow.config';

import { AuditService, AuditActor } from './audit.service';
import { AuthService } from './auth.service';

function toRecord<T>(document: { id: string; data: () => Record<string, unknown> }): T {
  return { id: document.id, ...document.data() } as T;
}

/** How long the branches cache stays fresh; branches are admin-managed reference data that rarely changes. */
const BRANCHES_TTL_MS = 60_000;

/** Items are flagged as expiring soon within this many days, for FEFO alerts. */
const EXPIRY_ALERT_DAYS = 90;

@Injectable({
  providedIn: 'root',
})
export class SupplyChainService {
  private branchesCache: Branch[] | null = null;

  private branchesCachedAt = 0;

  private branchesPromise: Promise<Branch[]> | null = null;

  constructor(
    private audit: AuditService,
    private auth: AuthService,
  ) {}

  /** The signed-in user, as an AuditActor, for logging who performed a mutation. */
  private actor(): AuditActor {
    return {
      uid: this.auth.user()?.uid || '',
      displayName: this.auth.displayName(),
      role: this.auth.profile()?.role || '',
    };
  }

  /** Wraps a Firestore call so every failure surfaces a consistent, readable error. */
  private async withErrorHandling<T>(action: string, task: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (error) {
      console.error(`${action} failed:`, error);

      if (error instanceof Error && error.message) {
        throw new Error(error.message);
      }

      throw new Error(`Unable to ${action.toLowerCase()}. Please try again.`);
    }
  }

  /* =====================================
     CONTROL NUMBER
  ===================================== */

  createTemporaryControlNumber(prefix: string): string {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    const time = Date.now().toString().slice(-6);

    return `${prefix}-${year}${month}${day}-${time}`;
  }

  /* =====================================
     BRANCHES
  ===================================== */

  /**
   * Loads branches, reusing a short-lived in-memory cache instead of hitting
   * Firestore on every visit to a page that needs the branch list (the New
   * Purchase Request form and the Branches page both load on every
   * navigation). Concurrent callers share one in-flight fetch. Pass
   * `forceRefresh: true` (the Branches page's Refresh button does this) to
   * bypass the cache and confirm the very latest data.
   */
  async getBranches(forceRefresh = false): Promise<Branch[]> {
    const isFresh =
      this.branchesCache !== null && Date.now() - this.branchesCachedAt < BRANCHES_TTL_MS;

    if (!forceRefresh && isFresh) {
      return this.branchesCache!;
    }

    if (!forceRefresh && this.branchesPromise) {
      return this.branchesPromise;
    }

    this.branchesPromise = this.withErrorHandling('Load branches', async () => {
      const snapshot = await getDocs(collection(db, 'branches'));

      const branches: Branch[] = snapshot.docs.map((documentSnapshot) => {
        const data = documentSnapshot.data();

        return {
          id: documentSnapshot.id,

          name: String(data['name'] ?? ''),

          region:
            data['region'] === 'LUZON'
              ? 'LUZON'
              : data['region'] === 'MINDANAO'
                ? 'MINDANAO'
                : 'VISAYAS',

          headquartersId: String(data['headquartersId'] ?? ''),

          headquartersName: String(data['headquartersName'] ?? ''),

          districtManagerId: String(data['districtManagerId'] ?? ''),

          districtManagerName: String(data['districtManagerName'] ?? ''),

          rnsId: String(data['rnsId'] ?? ''),

          rnsName: String(data['rnsName'] ?? ''),

          active: data['active'] !== false,
        };
      });

      branches.sort((a, b) => a.name.localeCompare(b.name));

      return branches;
    });

    try {
      const branches = await this.branchesPromise;

      this.branchesCache = branches;
      this.branchesCachedAt = Date.now();

      return branches;
    } finally {
      this.branchesPromise = null;
    }
  }

  async getBranch(id: string): Promise<Branch | null> {
    return this.withErrorHandling('Load branch', async () => {
      const snapshot = await getDoc(doc(db, 'branches', id));

      if (!snapshot.exists()) {
        return null;
      }

      return toRecord<Branch>(snapshot);
    });
  }

  async createBranch(branch: Branch): Promise<string> {
    return this.withErrorHandling('Save branch', async () => {
      const reference = await addDoc(collection(db, 'branches'), {
        name: branch.name.trim(),

        region: branch.region,

        headquartersId: branch.headquartersId.trim(),

        headquartersName: branch.headquartersName.trim(),

        districtManagerId: branch.districtManagerId.trim(),

        districtManagerName: branch.districtManagerName.trim(),

        rnsId: branch.rnsId.trim(),

        rnsName: branch.rnsName.trim(),

        active: branch.active,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      });

      this.branchesCache = null;

      await this.audit.log(this.actor(), 'CREATE', 'branch', reference.id, `Created branch ${branch.name}`);

      return reference.id;
    });
  }

  /* =====================================
     PURCHASE REQUESTS
  ===================================== */

  async createPurchaseRequest(request: PurchaseRequest): Promise<string> {
    return this.withErrorHandling('Save purchase request', async () => {
      const docRef = await addDoc(collection(db, 'purchaseRequests'), {
        controlNumber: request.controlNumber,
        requestDate: request.requestDate,
        branchId: request.branchId,
        branchName: request.branchName,
        headquartersId: request.headquartersId,
        headquartersName: request.headquartersName,
        districtManagerId: request.districtManagerId,
        districtManagerName: request.districtManagerName,
        department: request.department,
        preparedBy: request.preparedBy,
        items: request.items,
        totalAmount: request.totalAmount,
        remarks: request.remarks,
        status: request.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(
        this.actor(),
        'CREATE',
        'purchaseRequest',
        docRef.id,
        `Created ${request.controlNumber} for ${request.branchName}`,
      );

      return docRef.id;
    });
  }

  async getPurchaseRequests(): Promise<PurchaseRequest[]> {
    return this.withErrorHandling('Load purchase requests', async () => {
      const snapshot = await getDocs(collection(db, 'purchaseRequests'));

      return snapshot.docs.map((document) => {
        const data = document.data();

        return {
          id: document.id,

          controlNumber: data['controlNumber'] ?? '',
          requestDate: data['requestDate'] ?? '',
          branchId: data['branchId'] ?? '',
          branchName: data['branchName'] ?? '',
          headquartersId: data['headquartersId'] ?? '',
          headquartersName: data['headquartersName'] ?? '',
          districtManagerId: data['districtManagerId'] ?? '',
          districtManagerName: data['districtManagerName'] ?? '',
          department: data['department'] ?? '',
          preparedBy: data['preparedBy'] ?? '',
          items: data['items'] ?? [],
          totalAmount: data['totalAmount'] ?? 0,
          remarks: data['remarks'] ?? '',
          status: data['status'] ?? 'DRAFT',
        } as PurchaseRequest;
      });
    });
  }

  async getPurchaseRequest(id: string): Promise<PurchaseRequest | null> {
    return this.withErrorHandling('Load purchase request', async () => {
      const snapshot = await getDoc(doc(db, 'purchaseRequests', id));

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();

      return {
        id: snapshot.id,

        controlNumber: data['controlNumber'] ?? '',
        requestDate: data['requestDate'] ?? '',
        branchId: data['branchId'] ?? '',
        branchName: data['branchName'] ?? '',
        headquartersId: data['headquartersId'] ?? '',
        headquartersName: data['headquartersName'] ?? '',
        districtManagerId: data['districtManagerId'] ?? '',
        districtManagerName: data['districtManagerName'] ?? '',
        department: data['department'] ?? '',
        preparedBy: data['preparedBy'] ?? '',
        items: data['items'] ?? [],
        totalAmount: data['totalAmount'] ?? 0,
        remarks: data['remarks'] ?? '',
        status: data['status'] ?? 'DRAFT',
      } as PurchaseRequest;
    });
  }

  /** Requests matching a single status. */
  async getRequestsByStatus(status: RequestStatus): Promise<PurchaseRequest[]> {
    return this.getRequestsByStatuses([status]);
  }

  /** Requests matching any of the given statuses, fetched in one query. */
  async getRequestsByStatuses(statuses: RequestStatus[]): Promise<PurchaseRequest[]> {
    return this.withErrorHandling('Load purchase requests', async () => {
      if (statuses.length === 0) {
        return [];
      }

      const q = query(collection(db, 'purchaseRequests'), where('status', 'in', statuses));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => toRecord<PurchaseRequest>(document));
    });
  }

  /** Requests belonging to a single branch - used to scope a Nurse account to their assigned branch. */
  async getPurchaseRequestsForBranch(branchId: string): Promise<PurchaseRequest[]> {
    return this.withErrorHandling('Load purchase requests', async () => {
      const q = query(collection(db, 'purchaseRequests'), where('branchId', '==', branchId));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => toRecord<PurchaseRequest>(document));
    });
  }

  /* =====================================
     WORKFLOW
  ===================================== */

  async changeStatus(
    requestId: string,
    newStatus: RequestStatus,
    action: string,
    performedBy: string,
    comments: string = '',
  ): Promise<void> {
    return this.withErrorHandling('Update request status', async () => {
      const reference = doc(db, 'purchaseRequests', requestId);

      const snapshot = await getDoc(reference);

      if (!snapshot.exists()) {
        throw new Error('Purchase Request not found.');
      }

      const current = snapshot.data() as unknown as PurchaseRequest;

      const currentStatus: RequestStatus = current['status'];

      const allowedStatuses: RequestStatus[] = REQUEST_TRANSITIONS[currentStatus] ?? [];

      if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Invalid workflow transition: ${currentStatus} → ${newStatus}`);
      }

      await updateDoc(reference, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      await this.addWorkflowHistory({
        purchaseRequestId: requestId,
        fromStatus: currentStatus,
        toStatus: newStatus,
        action,
        comments,
        performedBy,
      });

      await this.audit.log(
        this.actor(),
        'STATUS_CHANGE',
        'purchaseRequest',
        requestId,
        `${action} (${currentStatus} → ${newStatus})`,
      );
    });
  }

  /* =====================================
     SUBMIT
  ===================================== */

  async submitPurchaseRequest(requestId: string, user: string) {
    await this.changeStatus(
      requestId,
      'PENDING_RNS_REVIEW',
      'Submitted for Regional Nurse Supervisor Review',
      user,
    );
  }

  /**
   * Applies edits to a request that was returned for revision. Only
   * touches the fields the branch can revise; status stays
   * RETURNED_FOR_REVISION until resubmitPurchaseRequest() advances it.
   */
  async updatePurchaseRequest(
    id: string,
    updates: Pick<
      PurchaseRequest,
      | 'requestDate'
      | 'branchId'
      | 'branchName'
      | 'headquartersId'
      | 'headquartersName'
      | 'districtManagerId'
      | 'districtManagerName'
      | 'department'
      | 'preparedBy'
      | 'items'
      | 'totalAmount'
      | 'remarks'
    >,
  ): Promise<void> {
    return this.withErrorHandling('Update purchase request', async () => {
      const reference = doc(db, 'purchaseRequests', id);

      const snapshot = await getDoc(reference);

      if (!snapshot.exists()) {
        throw new Error('Purchase Request not found.');
      }

      if (snapshot.data()['status'] !== 'RETURNED_FOR_REVISION') {
        throw new Error('Only requests returned for revision can be edited.');
      }

      await updateDoc(reference, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(this.actor(), 'UPDATE', 'purchaseRequest', id, 'Edited after revision');
    });
  }

  /** Resubmits an edited, previously-returned request back into the RNS review queue. */
  async resubmitPurchaseRequest(requestId: string, user: string) {
    await this.changeStatus(
      requestId,
      'PENDING_RNS_REVIEW',
      'Resubmitted After Revision',
      user,
    );
  }

  /* =====================================
     RNS REVIEW
  ===================================== */

  /** RNS endorsement forwards straight to the assigned HQ; District Manager approval is not required. */
  async endorseByRNS(requestId: string, rns: string, comments = '') {
    await this.changeStatus(
      requestId,
      'RECEIVED_BY_HQ',
      'Endorsed by Regional Nurse Supervisor - Forwarded to Assigned HQ',
      rns,
      comments,
    );
  }

  /** Returns a request to the branch for revision; usable from the RNS review stage. */
  async returnForRevision(requestId: string, actor: string, comments: string) {
    if (!comments.trim()) {
      throw new Error('Reason for return is required.');
    }

    await this.changeStatus(requestId, 'RETURNED_FOR_REVISION', 'Returned for Revision', actor, comments);
  }

  /* =====================================
     HQ
  ===================================== */

  async acknowledgeByHQ(requestId: string, user: string) {
    await this.changeStatus(requestId, 'RECEIVED_BY_HQ', 'Request Received by Assigned HQ', user);
  }

  async markHQConsolidated(requestId: string, performedBy: string) {
    const request = await this.getPurchaseRequest(requestId);

    if (!request) {
      throw new Error('Purchase Request not found.');
    }

    if (request.status === 'DM_APPROVED') {
      await this.acknowledgeByHQ(requestId, performedBy);
    }

    await this.changeStatus(
      requestId,
      'HQ_CONSOLIDATED',
      'Request Added to HQ Consolidation',
      performedBy,
    );
  }

  /* =====================================
     WORKFLOW HISTORY
  ===================================== */

  async addWorkflowHistory(history: Omit<WorkflowHistory, 'id' | 'performedAt'>) {
    return this.withErrorHandling('Save workflow history', async () => {
      await addDoc(collection(db, 'workflowHistory'), {
        ...history,
        performedAt: serverTimestamp(),
      });
    });
  }

  async getWorkflowHistory(requestId: string): Promise<WorkflowHistory[]> {
    return this.withErrorHandling('Load workflow history', async () => {
      const q = query(
        collection(db, 'workflowHistory'),
        where('purchaseRequestId', '==', requestId),
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => toRecord<WorkflowHistory>(document));
    });
  }

  /* =====================================
     PROCUREMENT
  ===================================== */

  async sendForProcurement(requestId: string, user: string) {
    return this.withErrorHandling('Send request for procurement', async () => {
      const request = await this.getPurchaseRequest(requestId);

      if (!request) {
        throw new Error('Request not found.');
      }

      if (request.status === 'PRS_CREATED') {
        await this.changeStatus(requestId, 'WAREHOUSE_CHECK', 'Warehouse Stock Check Started', user);
      }

      const refreshed = await this.getPurchaseRequest(requestId);

      if (refreshed?.status !== 'WAREHOUSE_CHECK') {
        throw new Error('Request is not ready for procurement.');
      }

      await this.changeStatus(
        requestId,
        'FOR_PROCUREMENT',
        'Insufficient Warehouse Stock - Sent for Procurement',
        user,
      );
    });
  }

  async completeProcurement(requestId: string, user: string) {
    await this.changeStatus(requestId, 'PROCUREMENT_COMPLETED', 'Procurement Completed', user);
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.withErrorHandling('Load purchase orders', async () => {
      const snapshot = await getDocs(collection(db, 'purchaseOrders'));

      return snapshot.docs.map((document) => toRecord<PurchaseOrder>(document));
    });
  }

  async createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status' | 'createdAt'>) {
    return this.withErrorHandling('Create purchase order', async () => {
      const poNumber = this.createTemporaryControlNumber('PO');

      const result = await addDoc(collection(db, 'purchaseOrders'), {
        ...data,
        poNumber,
        status: 'DRAFT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(this.actor(), 'CREATE', 'purchaseOrder', result.id, `Created ${poNumber}`);

      return result;
    });
  }

  /* =====================================
     PRS
  ===================================== */

  async createPRSFromRequest(request: PurchaseRequest, preparedBy: string) {
    return this.withErrorHandling('Generate PRS', async () => {
      if (!request.id) {
        throw new Error('Purchase Request ID is missing.');
      }

      if (request.status !== 'HQ_CONSOLIDATED') {
        throw new Error('Only HQ-consolidated requests can generate a PRS.');
      }

      const prsNumber = this.createTemporaryControlNumber('PRS');

      const result = await addDoc(collection(db, 'prs'), {
        prsNumber,
        headquartersId: request.headquartersId,
        headquartersName: request.headquartersName,
        purchaseRequestIds: [request.id],
        date: new Date().toISOString().substring(0, 10),
        items: request.items,
        totalAmount: request.totalAmount,
        preparedBy,
        reviewedBy: '',
        approvedBy: '',
        status: 'DRAFT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.changeStatus(request.id, 'PRS_CREATED', `PRS ${prsNumber} Created`, preparedBy);

      await this.audit.log(this.actor(), 'CREATE', 'prs', result.id, `Generated ${prsNumber}`);

      return result.id;
    });
  }

  async getPRS(): Promise<PRS[]> {
    return this.withErrorHandling('Load PRS records', async () => {
      const snapshot = await getDocs(collection(db, 'prs'));

      return snapshot.docs.map((document) => toRecord<PRS>(document));
    });
  }

  /* =====================================
     INVENTORY
  ===================================== */

  async getInventory(): Promise<Inventory[]> {
    return this.withErrorHandling('Load inventory', async () => {
      const snapshot = await getDocs(collection(db, 'inventory'));

      return snapshot.docs.map((document) => toRecord<Inventory>(document));
    });
  }

  async addInventory(data: Omit<Inventory, 'id' | 'updatedAt'>) {
    return this.withErrorHandling('Save inventory record', async () => {
      const result = await addDoc(collection(db, 'inventory'), {
        ...data,
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(
        this.actor(),
        'CREATE',
        'inventory',
        result.id,
        `Added ${data.quantity} ${data.productName} at ${data.locationName}`,
      );

      return result;
    });
  }

  /**
   * True when an inventory item's expiry falls within EXPIRY_ALERT_DAYS -
   * the FEFO ("first expiry, first out") early-warning window.
   */
  isExpiringSoon(item: Inventory): boolean {
    if (!item.expiryDate) {
      return false;
    }

    const expiry = new Date(item.expiryDate).getTime();

    if (Number.isNaN(expiry)) {
      return false;
    }

    const daysUntilExpiry = (expiry - Date.now()) / (1000 * 60 * 60 * 24);

    return daysUntilExpiry <= EXPIRY_ALERT_DAYS;
  }

  isExpired(item: Inventory): boolean {
    if (!item.expiryDate) {
      return false;
    }

    return new Date(item.expiryDate).getTime() < Date.now();
  }

  async createInventoryTransaction(data: Record<string, unknown>) {
    return this.withErrorHandling('Save inventory transaction', async () => {
      return addDoc(collection(db, 'inventoryTransactions'), {
        ...data,
        createdAt: serverTimestamp(),
      });
    });
  }

  /* =====================================
     VACCINE WASTAGE
  ===================================== */

  async getVaccineWastageEntries(): Promise<VaccineWastageEntry[]> {
    return this.withErrorHandling('Load vaccine wastage entries', async () => {
      const snapshot = await getDocs(collection(db, 'vaccineWastageLogs'));

      return snapshot.docs.map((document) => toRecord<VaccineWastageEntry>(document));
    });
  }

  async getVaccineWastageEntriesForBranch(branchId: string): Promise<VaccineWastageEntry[]> {
    return this.withErrorHandling('Load vaccine wastage entries', async () => {
      const q = query(collection(db, 'vaccineWastageLogs'), where('branchId', '==', branchId));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => toRecord<VaccineWastageEntry>(document));
    });
  }

  /**
   * Records one vial-usage entry, computing expectedUsage and wastage per
   * the workflow's formulas: Expected Usage = Patients Served ÷ Vaccine
   * Capacity, Wastage = Available Vials - Used Vials.
   */
  async createVaccineWastageEntry(
    entry: Omit<VaccineWastageEntry, 'id' | 'expectedUsage' | 'wastage' | 'createdAt'>,
  ): Promise<string> {
    return this.withErrorHandling('Save vaccine wastage entry', async () => {
      if (entry.vaccineCapacity <= 0) {
        throw new Error('Vaccine capacity must be greater than zero.');
      }

      const expectedUsage = Math.ceil(entry.patientsServed / entry.vaccineCapacity);

      const wastage = entry.availableVials - entry.usedVials;

      if (wastage > 0 && !entry.reason.trim()) {
        throw new Error('A reason is required when vials are wasted.');
      }

      const result = await addDoc(collection(db, 'vaccineWastageLogs'), {
        ...entry,
        expectedUsage,
        wastage,
        createdAt: serverTimestamp(),
      });

      await this.audit.log(
        this.actor(),
        'CREATE',
        'vaccineWastage',
        result.id,
        `${entry.vaccineName} at ${entry.branchName}: ${wastage} vial(s) wasted`,
      );

      return result.id;
    });
  }

  /* =====================================
     DELIVERIES
  ===================================== */

  async getDeliveries(): Promise<DeliveryNote[]> {
    return this.withErrorHandling('Load deliveries', async () => {
      const snapshot = await getDocs(collection(db, 'deliveryNotes'));

      return snapshot.docs.map((document) => toRecord<DeliveryNote>(document));
    });
  }

  async createDelivery(delivery: Omit<DeliveryNote, 'id' | 'status' | 'createdAt'>) {
    return this.withErrorHandling('Create delivery', async () => {
      const result = await addDoc(collection(db, 'deliveryNotes'), {
        ...delivery,
        status: 'PREPARING',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(
        this.actor(),
        'CREATE',
        'delivery',
        result.id,
        `Created ${delivery.deliveryNumber} for ${delivery.branchName}`,
      );

      return result;
    });
  }

  async dispatchDelivery(id: string) {
    return this.withErrorHandling('Dispatch delivery', async () => {
      await updateDoc(doc(db, 'deliveryNotes', id), {
        status: 'DISPATCHED',
        dispatchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(this.actor(), 'UPDATE', 'delivery', id, 'Dispatched');
    });
  }

  async getDeliveriesForReceiving(): Promise<DeliveryNote[]> {
    return this.withErrorHandling('Load deliveries for receiving', async () => {
      const q = query(collection(db, 'deliveryNotes'), where('status', '==', 'DISPATCHED'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => toRecord<DeliveryNote>(document));
    });
  }

  /* =====================================
     RECEIVING
  ===================================== */

  async getReceivingReports(): Promise<ReceivingReport[]> {
    return this.withErrorHandling('Load receiving reports', async () => {
      const snapshot = await getDocs(collection(db, 'receivingReports'));

      return snapshot.docs.map((document) => toRecord<ReceivingReport>(document));
    });
  }

  async createReceivingReport(
    delivery: DeliveryNote,
    receivedBy: string,
    hasDiscrepancy: boolean,
    remarks: string,
  ) {
    return this.withErrorHandling('Submit receiving report', async () => {
      if (!delivery.id) {
        throw new Error('Delivery ID is required.');
      }

      const receivingNumber = this.createTemporaryControlNumber('RR');

      const result = await addDoc(collection(db, 'receivingReports'), {
        receivingNumber,
        deliveryNoteId: delivery.id,
        deliveryNumber: delivery.deliveryNumber,
        branchId: delivery.branchId,
        branchName: delivery.branchName,
        items: delivery.items || [],
        receivedBy,
        receivedDate: new Date().toISOString().substring(0, 10),
        hasDiscrepancy,
        discrepancyRemarks: remarks,
        status: hasDiscrepancy ? 'DISCREPANCY' : 'VERIFIED',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'deliveryNotes', delivery.id), {
        status: hasDiscrepancy ? 'DELIVERED' : 'RECEIVED',
        receivedBy,
        receivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(
        this.actor(),
        'CREATE',
        'receivingReport',
        result.id,
        `Created ${receivingNumber}${hasDiscrepancy ? ' (discrepancy flagged)' : ''}`,
      );

      return result.id;
    });
  }

  /* =====================================
     DISCREPANCIES
  ===================================== */

  async getDiscrepancies(): Promise<ReceivingReport[]> {
    return this.withErrorHandling('Load discrepancies', async () => {
      const q = query(collection(db, 'receivingReports'), where('status', '==', 'DISCREPANCY'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => toRecord<ReceivingReport>(document));
    });
  }

  async resolveDiscrepancy(id: string, resolution: string) {
    return this.withErrorHandling('Resolve discrepancy', async () => {
      if (!resolution.trim()) {
        throw new Error('Resolution is required.');
      }

      await updateDoc(doc(db, 'receivingReports', id), {
        status: 'RESOLVED',
        resolution,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(this.actor(), 'UPDATE', 'receivingReport', id, `Resolved: ${resolution}`);
    });
  }

  /* =====================================
     SUPPLIERS
  ===================================== */

  async getSuppliers(): Promise<Supplier[]> {
    return this.withErrorHandling('Load suppliers', async () => {
      const snapshot = await getDocs(collection(db, 'suppliers'));

      return snapshot.docs.map((document) => toRecord<Supplier>(document));
    });
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'active' | 'createdAt'>) {
    return this.withErrorHandling('Save supplier', async () => {
      const result = await addDoc(collection(db, 'suppliers'), {
        ...supplier,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(this.actor(), 'CREATE', 'supplier', result.id, `Added supplier ${supplier.name}`);

      return result;
    });
  }

  /* =====================================
     STATEMENT OF ACCOUNT
  ===================================== */

  async getSOA(): Promise<StatementOfAccount[]> {
    return this.withErrorHandling('Load statements of account', async () => {
      const snapshot = await getDocs(collection(db, 'statementsOfAccount'));

      return snapshot.docs.map((document) => toRecord<StatementOfAccount>(document));
    });
  }

  async createSOA(data: Omit<StatementOfAccount, 'id' | 'soaNumber' | 'status' | 'createdAt'>) {
    return this.withErrorHandling('Create statement of account', async () => {
      const soaNumber = this.createTemporaryControlNumber('SOA');

      const result = await addDoc(collection(db, 'statementsOfAccount'), {
        ...data,
        soaNumber,
        status: 'DRAFT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(this.actor(), 'CREATE', 'statementOfAccount', result.id, `Created ${soaNumber}`);

      return result;
    });
  }

  /* =====================================
     SYSTEM SETTINGS
  ===================================== */

  async getSystemSettings(): Promise<SystemSettings | null> {
    return this.withErrorHandling('Load settings', async () => {
      const snapshot = await getDoc(doc(db, 'systemSettings', 'general'));

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as SystemSettings;
    });
  }

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
    return this.withErrorHandling('Save settings', async () => {
      await setDoc(doc(db, 'systemSettings', 'general'), {
        ...settings,
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(this.actor(), 'UPDATE', 'systemSettings', 'general', 'Updated system settings');
    });
  }

  /* =====================================
     CONTACT / SUPPORT
  ===================================== */

  async submitContactMessage(data: { name: string; email: string; message: string }) {
    return this.withErrorHandling('Send contact message', async () => {
      return addDoc(collection(db, 'contactMessages'), {
        ...data,
        status: 'NEW',
        createdAt: serverTimestamp(),
      });
    });
  }

  /* =====================================
     NEWSLETTER / SYSTEM UPDATES
  ===================================== */

  async subscribeNewsletter(email: string): Promise<void> {
    return this.withErrorHandling('Subscribe to updates', async () => {
      const normalized = email.trim().toLowerCase();

      if (!normalized) {
        throw new Error('Email address is required.');
      }

      const existing = await getDocs(
        query(collection(db, 'newsletterSubscribers'), where('email', '==', normalized)),
      );

      if (!existing.empty) {
        // Already subscribed - treat as a successful, idempotent signup.
        return;
      }

      await addDoc(collection(db, 'newsletterSubscribers'), {
        email: normalized,
        subscribedAt: serverTimestamp(),
      });
    });
  }
}

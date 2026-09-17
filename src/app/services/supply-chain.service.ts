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
} from '../models/supply-chain.model';

import { REQUEST_TRANSITIONS } from '../config/workflow.config';

/** Wraps a Firestore call so every failure surfaces a consistent, readable error. */
async function withErrorHandling<T>(action: string, task: () => Promise<T>): Promise<T> {
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

function toRecord<T>(document: { id: string; data: () => Record<string, unknown> }): T {
  return { id: document.id, ...document.data() } as T;
}

/** How long the branches cache stays fresh; branches are admin-managed reference data that rarely changes. */
const BRANCHES_TTL_MS = 60_000;

@Injectable({
  providedIn: 'root',
})
export class SupplyChainService {
  private branchesCache: Branch[] | null = null;

  private branchesCachedAt = 0;

  private branchesPromise: Promise<Branch[]> | null = null;

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

    this.branchesPromise = withErrorHandling('Load branches', async () => {
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
    return withErrorHandling('Load branch', async () => {
      const snapshot = await getDoc(doc(db, 'branches', id));

      if (!snapshot.exists()) {
        return null;
      }

      return toRecord<Branch>(snapshot);
    });
  }

  async createBranch(branch: Branch): Promise<string> {
    return withErrorHandling('Save branch', async () => {
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

      return reference.id;
    });
  }

  /* =====================================
     PURCHASE REQUESTS
  ===================================== */

  async createPurchaseRequest(request: PurchaseRequest): Promise<string> {
    return withErrorHandling('Save purchase request', async () => {
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

      return docRef.id;
    });
  }

  async getPurchaseRequests(): Promise<PurchaseRequest[]> {
    return withErrorHandling('Load purchase requests', async () => {
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
    return withErrorHandling('Load purchase request', async () => {
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
    return withErrorHandling('Load purchase requests', async () => {
      if (statuses.length === 0) {
        return [];
      }

      const q = query(collection(db, 'purchaseRequests'), where('status', 'in', statuses));

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
    return withErrorHandling('Update request status', async () => {
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
    });
  }

  /* =====================================
     SUBMIT
  ===================================== */

  async submitPurchaseRequest(requestId: string, user: string) {
    await this.changeStatus(
      requestId,
      'PENDING_DM_APPROVAL',
      'Submitted for District Manager Approval',
      user,
    );
  }

  /* =====================================
     DM APPROVAL
  ===================================== */

  async approveByDM(requestId: string, dm: string, comments = '') {
    await this.changeStatus(requestId, 'DM_APPROVED', 'Approved by District Manager', dm, comments);
  }

  async returnForRevision(requestId: string, dm: string, comments: string) {
    if (!comments.trim()) {
      throw new Error('Reason for return is required.');
    }

    await this.changeStatus(requestId, 'RETURNED_FOR_REVISION', 'Returned for Revision', dm, comments);
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
    return withErrorHandling('Save workflow history', async () => {
      await addDoc(collection(db, 'workflowHistory'), {
        ...history,
        performedAt: serverTimestamp(),
      });
    });
  }

  async getWorkflowHistory(requestId: string): Promise<WorkflowHistory[]> {
    return withErrorHandling('Load workflow history', async () => {
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
    return withErrorHandling('Send request for procurement', async () => {
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
    return withErrorHandling('Load purchase orders', async () => {
      const snapshot = await getDocs(collection(db, 'purchaseOrders'));

      return snapshot.docs.map((document) => toRecord<PurchaseOrder>(document));
    });
  }

  async createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status' | 'createdAt'>) {
    return withErrorHandling('Create purchase order', async () => {
      return addDoc(collection(db, 'purchaseOrders'), {
        ...data,
        poNumber: this.createTemporaryControlNumber('PO'),
        status: 'DRAFT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  /* =====================================
     PRS
  ===================================== */

  async createPRSFromRequest(request: PurchaseRequest, preparedBy: string) {
    return withErrorHandling('Generate PRS', async () => {
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

      return result.id;
    });
  }

  async getPRS(): Promise<PRS[]> {
    return withErrorHandling('Load PRS records', async () => {
      const snapshot = await getDocs(collection(db, 'prs'));

      return snapshot.docs.map((document) => toRecord<PRS>(document));
    });
  }

  /* =====================================
     INVENTORY
  ===================================== */

  async getInventory(): Promise<Inventory[]> {
    return withErrorHandling('Load inventory', async () => {
      const snapshot = await getDocs(collection(db, 'inventory'));

      return snapshot.docs.map((document) => toRecord<Inventory>(document));
    });
  }

  async addInventory(data: Omit<Inventory, 'id' | 'updatedAt'>) {
    return withErrorHandling('Save inventory record', async () => {
      return addDoc(collection(db, 'inventory'), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    });
  }

  async createInventoryTransaction(data: Record<string, unknown>) {
    return withErrorHandling('Save inventory transaction', async () => {
      return addDoc(collection(db, 'inventoryTransactions'), {
        ...data,
        createdAt: serverTimestamp(),
      });
    });
  }

  /* =====================================
     DELIVERIES
  ===================================== */

  async getDeliveries(): Promise<DeliveryNote[]> {
    return withErrorHandling('Load deliveries', async () => {
      const snapshot = await getDocs(collection(db, 'deliveryNotes'));

      return snapshot.docs.map((document) => toRecord<DeliveryNote>(document));
    });
  }

  async createDelivery(delivery: Omit<DeliveryNote, 'id' | 'status' | 'createdAt'>) {
    return withErrorHandling('Create delivery', async () => {
      return addDoc(collection(db, 'deliveryNotes'), {
        ...delivery,
        status: 'PREPARING',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  async dispatchDelivery(id: string) {
    return withErrorHandling('Dispatch delivery', async () => {
      await updateDoc(doc(db, 'deliveryNotes', id), {
        status: 'DISPATCHED',
        dispatchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  async getDeliveriesForReceiving(): Promise<DeliveryNote[]> {
    return withErrorHandling('Load deliveries for receiving', async () => {
      const q = query(collection(db, 'deliveryNotes'), where('status', '==', 'DISPATCHED'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => toRecord<DeliveryNote>(document));
    });
  }

  /* =====================================
     RECEIVING
  ===================================== */

  async getReceivingReports(): Promise<ReceivingReport[]> {
    return withErrorHandling('Load receiving reports', async () => {
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
    return withErrorHandling('Submit receiving report', async () => {
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

      return result.id;
    });
  }

  /* =====================================
     DISCREPANCIES
  ===================================== */

  async getDiscrepancies(): Promise<ReceivingReport[]> {
    return withErrorHandling('Load discrepancies', async () => {
      const q = query(collection(db, 'receivingReports'), where('status', '==', 'DISCREPANCY'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((document) => toRecord<ReceivingReport>(document));
    });
  }

  async resolveDiscrepancy(id: string, resolution: string) {
    return withErrorHandling('Resolve discrepancy', async () => {
      if (!resolution.trim()) {
        throw new Error('Resolution is required.');
      }

      await updateDoc(doc(db, 'receivingReports', id), {
        status: 'RESOLVED',
        resolution,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  /* =====================================
     SUPPLIERS
  ===================================== */

  async getSuppliers(): Promise<Supplier[]> {
    return withErrorHandling('Load suppliers', async () => {
      const snapshot = await getDocs(collection(db, 'suppliers'));

      return snapshot.docs.map((document) => toRecord<Supplier>(document));
    });
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'active' | 'createdAt'>) {
    return withErrorHandling('Save supplier', async () => {
      return addDoc(collection(db, 'suppliers'), {
        ...supplier,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  /* =====================================
     STATEMENT OF ACCOUNT
  ===================================== */

  async getSOA(): Promise<StatementOfAccount[]> {
    return withErrorHandling('Load statements of account', async () => {
      const snapshot = await getDocs(collection(db, 'statementsOfAccount'));

      return snapshot.docs.map((document) => toRecord<StatementOfAccount>(document));
    });
  }

  async createSOA(data: Omit<StatementOfAccount, 'id' | 'soaNumber' | 'status' | 'createdAt'>) {
    return withErrorHandling('Create statement of account', async () => {
      return addDoc(collection(db, 'statementsOfAccount'), {
        ...data,
        soaNumber: this.createTemporaryControlNumber('SOA'),
        status: 'DRAFT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  /* =====================================
     SYSTEM SETTINGS
  ===================================== */

  async getSystemSettings(): Promise<SystemSettings | null> {
    return withErrorHandling('Load settings', async () => {
      const snapshot = await getDoc(doc(db, 'systemSettings', 'general'));

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as SystemSettings;
    });
  }

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
    return withErrorHandling('Save settings', async () => {
      await setDoc(doc(db, 'systemSettings', 'general'), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    });
  }

  /* =====================================
     CONTACT / SUPPORT
  ===================================== */

  async submitContactMessage(data: { name: string; email: string; message: string }) {
    return withErrorHandling('Send contact message', async () => {
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
    return withErrorHandling('Subscribe to updates', async () => {
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

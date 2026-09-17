import { Injectable } from '@angular/core';

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

import { db } from '../config/firebase.config';

import {
  PurchaseRequest,
  RequestStatus,
  Branch,
  WorkflowHistory,
} from '../models/supply-chain.model';

import { REQUEST_TRANSITIONS } from '../config/workflow.config';

@Injectable({
  providedIn: 'root',
})
export class SupplyChainService {
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

  async getBranches(): Promise<Branch[]> {
    try {
      const branchCollection = collection(db, 'branches');

      const snapshot = await getDocs(branchCollection);

      const branches: Branch[] = snapshot.docs.map((documentSnapshot) => {
        const data = documentSnapshot.data();

        return {
          ...data,

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

      console.log(`${branches.length} branches loaded from Firestore.`);

      return branches;
    } catch (error) {
      console.error('Error loading branches:', error);

      throw error;
    }
  }

  async getBranch(id: string): Promise<Branch | null> {
    const reference = doc(db, 'branches', id);

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Branch;
  }

  /* =====================================
     PURCHASE REQUESTS
  ===================================== */

  async createPurchaseRequest(request: PurchaseRequest): Promise<string> {
    try {
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

      console.log('PR Saved:', docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('Save PR Error:', error);

      throw error;
    }
  }

async getPurchaseRequests(): Promise<PurchaseRequest[]> {

  const snapshot =
    await getDocs(
      collection(
        db,
        'purchaseRequests'
      )
    );


  return snapshot.docs.map(

    document => {

      const data =
        document.data();


      return {

        // Spread first so every stored field (including createdAt/updatedAt
        // and anything added later) survives the round-trip, then apply
        // defaults for the fields this screen relies on.
        ...data,

        id:
          document.id,   // IMPORTANT


        controlNumber:
          data['controlNumber'] ?? '',


        requestDate:
          data['requestDate'] ?? '',


        branchId:
          data['branchId'] ?? '',


        branchName:
          data['branchName'] ?? '',


        headquartersId:
          data['headquartersId'] ?? '',


        headquartersName:
          data['headquartersName'] ?? '',


        districtManagerId:
          data['districtManagerId'] ?? '',


        districtManagerName:
          data['districtManagerName'] ?? '',


        department:
          data['department'] ?? '',


        preparedBy:
          data['preparedBy'] ?? '',


        items:
          data['items'] ?? [],


        totalAmount:
          data['totalAmount'] ?? 0,


        remarks:
          data['remarks'] ?? '',


        status:
          data['status'] ?? 'DRAFT'

      } as PurchaseRequest;


    }

  );

}

  async getPurchaseRequest(id: string): Promise<PurchaseRequest | null> {
    const ref = doc(db, 'purchaseRequests', id);

    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      console.error('NO PURCHASE REQUEST FOUND:', id);

      return null;
    }

    const data = snapshot.data();

    return {
      ...data,

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
    await this.changeStatus(
      requestId,

      'DM_APPROVED',

      'Approved by District Manager',

      dm,

      comments,
    );
  }

  async returnForRevision(requestId: string, dm: string, comments: string) {
    if (!comments.trim()) {
      throw new Error('Reason for return is required.');
    }

    await this.changeStatus(
      requestId,

      'RETURNED_FOR_REVISION',

      'Returned for Revision',

      dm,

      comments,
    );
  }

  /* =====================================
     HQ
  ===================================== */

  async acknowledgeByHQ(requestId: string, user: string) {
    await this.changeStatus(
      requestId,

      'RECEIVED_BY_HQ',

      'Request Received by Assigned HQ',

      user,
    );
  }

  /* =====================================
     WORKFLOW HISTORY
  ===================================== */

  async addWorkflowHistory(history: Omit<WorkflowHistory, 'id' | 'performedAt'>) {
    await addDoc(
      collection(db, 'workflowHistory'),

      {
        ...history,

        performedAt: serverTimestamp(),
      },
    );
  }

  async getWorkflowHistory(requestId: string): Promise<WorkflowHistory[]> {
    const q = query(
      collection(db, 'workflowHistory'),

      where('purchaseRequestId', '==', requestId),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,

          ...doc.data(),
        }) as WorkflowHistory,
    );
  }
  /////// getSOA

  async getSOA(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'statementsOfAccount'));

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  async createSOA(data: any) {
    return addDoc(collection(db, 'statementsOfAccount'), {
      ...data,

      soaNumber: this.createTemporaryControlNumber('SOA'),

      status: 'DRAFT',

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async getPurchaseOrders(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'purchaseOrders'));

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  async createPurchaseOrder(data: any) {
    return addDoc(collection(db, 'purchaseOrders'), {
      ...data,

      poNumber: this.createTemporaryControlNumber('PO'),

      status: 'DRAFT',

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async sendForProcurement(requestId: string, user: string) {
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
  }

  async completeProcurement(requestId: string, user: string) {
    await this.changeStatus(requestId, 'PROCUREMENT_COMPLETED', 'Procurement Completed', user);
  }

  // =====================================getrequests by status
  async getRequestsByStatus(status: RequestStatus): Promise<PurchaseRequest[]> {
    const q = query(
      collection(db, 'purchaseRequests'),

      where('status', '==', status),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        ...data,

        id: doc.id,

        controlNumber: data['controlNumber'],

        branchName: data['branchName'],

        status: data['status'],

        items: data['items'],

        totalAmount: data['totalAmount'],
      } as PurchaseRequest;
    });
  }

  //HQ Consolidation
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

  //PRS PAge

  async createPRSFromRequest(request: PurchaseRequest, preparedBy: string) {
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
  }

  async getPRS(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'prs'));

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  //Invetory
  async getInventory(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'inventory'));

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  async addInventory(data: any) {
    return addDoc(collection(db, 'inventory'), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async createInventoryTransaction(data: any) {
    return addDoc(collection(db, 'inventoryTransactions'), {
      ...data,
      createdAt: serverTimestamp(),
    });
  }

  //delivery
  async getDeliveries(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'deliveryNotes'));

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  async createDelivery(delivery: any) {
    return addDoc(collection(db, 'deliveryNotes'), {
      ...delivery,

      status: 'PREPARING',

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async dispatchDelivery(id: string) {
    await updateDoc(doc(db, 'deliveryNotes', id), {
      status: 'DISPATCHED',

      dispatchedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  //Receiving Service

  async getReceivingReports(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'receivingReports'));

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  async getDeliveriesForReceiving(): Promise<any[]> {
    const q = query(collection(db, 'deliveryNotes'), where('status', '==', 'DISPATCHED'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  //receiving report

  async createReceivingReport(
    delivery: any,
    receivedBy: string,
    hasDiscrepancy: boolean,
    remarks: string,
  ) {
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
  }

  //discrepancy

  async getDiscrepancies(): Promise<any[]> {
    const q = query(collection(db, 'receivingReports'), where('status', '==', 'DISCREPANCY'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  async resolveDiscrepancy(id: string, resolution: string) {
    if (!resolution.trim()) {
      throw new Error('Resolution is required.');
    }

    await updateDoc(doc(db, 'receivingReports', id), {
      status: 'RESOLVED',

      resolution,

      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  //branches
  async createBranch(branch: Branch): Promise<string> {
    try {
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

      console.log('Branch successfully saved to Firestore:', reference.id);

      return reference.id;
    } catch (error) {
      console.error('Error saving branch:', error);

      throw error;
    }
  }

  // Supplpiers

  async getSuppliers(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'suppliers'));

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  }

  async createSupplier(supplier: any) {
    return addDoc(collection(db, 'suppliers'), {
      ...supplier,

      active: true,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /* =====================================
     CONTACT / SUPPORT
  ===================================== */

  async submitContactMessage(data: { name: string; email: string; message: string }) {
    return addDoc(collection(db, 'contactMessages'), {
      ...data,

      status: 'NEW',

      createdAt: serverTimestamp(),
    });
  }

  /* =====================================
     NEWSLETTER / SYSTEM UPDATES
  ===================================== */

  async subscribeNewsletter(email: string): Promise<void> {
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
  }
}

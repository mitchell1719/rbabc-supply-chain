export type RequestStatus =
  | 'DRAFT'
  | 'PENDING_DM_APPROVAL'
  | 'RETURNED_FOR_REVISION'
  | 'DM_APPROVED'
  | 'RECEIVED_BY_HQ'
  | 'HQ_CONSOLIDATED'
  | 'PRS_CREATED'
  | 'WAREHOUSE_CHECK'
  | 'FOR_PROCUREMENT'
  | 'PROCUREMENT_COMPLETED'
  | 'FOR_DELIVERY'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RECEIVING_VERIFICATION'
  | 'DISCREPANCY'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Branch {
  id?: string;

  name: string;

  region: 'LUZON' | 'VISAYAS' | 'MINDANAO';

  headquartersId: string;
  headquartersName: string;

  districtManagerId: string;
  districtManagerName: string;

  rnsId: string;
  rnsName: string;

  active: boolean;
}

export interface Product {
  id?: string;

  productCode: string;

  name: string;

  category: string;

  unit: string;

  supplierPrice: number;

  hqPrice: number;

  branchPrice: number;

  active: boolean;
}

export interface PurchaseRequestItem {
  productId?: string;

  description: string;

  quantity: number;

  unit: string;

  currentStock: number;

  expectedConsumption: number;

  justification: string;

  unitCost: number;

  totalCost: number;
}

export interface PurchaseRequest {
  id?: string;

  controlNumber: string;

  requestDate: string;

  branchId: string;

  branchName: string;

  department: string;
  headquartersId: string;
  headquartersName: string;
  districtManagerId: string;
  districtManagerName: string;

  preparedBy: string;

  items: PurchaseRequestItem[]; 

  totalAmount: number;

  remarks: string;

  status: RequestStatus;

  createdAt?: any;

  updatedAt?: any;
}

export interface WorkflowHistory {
  id?: string;

  purchaseRequestId: string;

  fromStatus: RequestStatus;

  toStatus: RequestStatus;

  action: string;

  comments?: string;

  performedBy: string;

  createdAt?: unknown;
}

export interface PRS {
  id?: string;

  prsNumber: string;

  headquartersId: string;

  headquartersName: string;

  purchaseRequestIds: string[];

  date: string;

  totalAmount: number;

  preparedBy: string;

  reviewedBy: string;

  approvedBy: string;

  status: 'DRAFT' | 'FOR_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'COMPLETED';

  createdAt?: any;
}

export interface Inventory {
  id?: string;

  locationType: 'BRANCH' | 'HQ' | 'CENTRAL_WAREHOUSE';

  locationId: string;

  locationName: string;

  productId: string;

  productName: string;

  batchNumber: string;

  expiryDate: string;

  quantity: number;

  reorderLevel: number;

  updatedAt?: any;
}

export interface InventoryTransaction {
  id?: string;

  locationId: string;

  productId: string;

  transactionType: 'RECEIPT' | 'ISSUE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'WASTAGE';

  quantity: number;

  referenceType: string;

  referenceId: string;

  performedBy: string;

  createdAt?: any;
}

export interface DeliveryItem {
  productId: string;

  description: string;

  quantity: number;

  unit: string;

  batchNumber: string;

  expiryDate: string;
}

export interface DeliveryNote {
  id?: string;

  deliveryNumber: string;

  prsId: string;

  prsNumber: string;

  branchId: string;

  branchName: string;

  deliveryDate: string;

  items: DeliveryItem[];

  preparedBy: string;

  approvedBy: string;

  receivedBy?: string;

  status: 'PREPARING' | 'DISPATCHED' | 'DELIVERED' | 'RECEIVED';

  createdAt?: any;
}

export interface ReceivingReport {
  id?: string;

  receivingNumber: string;

  deliveryNoteId: string;

  branchId: string;

  branchName: string;

  receivedBy: string;

  receivedDate: string;

  hasDiscrepancy: boolean;

  discrepancyRemarks: string;

  status: 'PENDING' | 'VERIFIED' | 'DISCREPANCY' | 'RESOLVED';

  createdAt?: any;
}

export interface StatementOfAccount {
  id?: string;

  soaNumber: string;

  districtManagerName: string;

  branchName: string;

  reference: string;

  totalAmount: number;

  preparedBy: string;

  status: 'DRAFT' | 'FOR_VERIFICATION' | 'SUBMITTED_TO_FINANCE' | 'PROCESSED' | 'PAID';

  createdAt?: any;
}

export interface Supplier {
  id?: string;

  name: string;

  contactPerson: string;

  phone: string;

  email: string;

  address: string;

  active: boolean;

  createdAt?: any;
}

export interface PurchaseOrder {
  id?: string;

  poNumber: string;

  supplierName: string;

  reference: string;

  amount: number;

  remarks: string;

  status: 'DRAFT' | 'SENT' | 'FULFILLED' | 'CANCELLED';

  createdAt?: any;
}

export interface AppUser {
  uid: string;

  email: string | null;

  displayName: string | null;
}

export interface SystemSettings {
  companyName: string;

  department: string;

  systemName: string;

  updatedAt?: any;
}

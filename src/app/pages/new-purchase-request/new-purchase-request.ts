import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { SupplyChainService } from '../../services/supply-chain.service';

import { AuthService } from '../../services/auth.service';

import { Branch, PurchaseRequest, PurchaseRequestItem } from '../../models/supply-chain.model';

import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-new-purchase-request',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './new-purchase-request.html',

  styleUrl: './new-purchase-request.css',
})
export class NewPurchaseRequest implements OnInit {
  readonly branches = signal<Branch[]>([]);

  selectedBranchId = '';

  department = '';

  preparedBy = '';

  remarks = '';

  controlNumber = '';

  requestDate = new Date().toISOString().substring(0, 10);

  items: PurchaseRequestItem[] = [];

  readonly loadingBranches = signal(false);

  readonly loadError = signal('');

  readonly submitting = signal(false);

  /** Set when editing a request that was returned for revision (route: /purchase-requests/:id/edit). */
  readonly editMode = signal(false);

  readonly editId = signal<string | null>(null);

  readonly loadingExisting = signal(false);

  readonly loadExistingError = signal('');

  constructor(
    private service: SupplyChainService,

    private auth: AuthService,

    private router: Router,

    private route: ActivatedRoute,

    private confirmService: ConfirmService,
  ) {}

  async ngOnInit() {
    this.preparedBy = this.auth.displayName();

    await this.loadBranches();

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.editMode.set(true);
      this.editId.set(id);

      await this.loadExisting(id);
    } else {
      this.controlNumber = this.service.createTemporaryControlNumber('PR');

      for (let i = 0; i < 3; i++) {
        this.addItem();
      }

      this.applyDefaultBranch();
    }
  }

  /** Nurses (branch users) get their assigned branch preselected. */
  private applyDefaultBranch() {
    const profile = this.auth.profile();

    if (profile?.role === 'NURSE' && profile.branchId) {
      this.selectedBranchId = profile.branchId;
    }
  }

  async loadExisting(id: string) {
    this.loadingExisting.set(true);

    this.loadExistingError.set('');

    try {
      const request = await this.service.getPurchaseRequest(id);

      if (!request) {
        throw new Error('Purchase request not found.');
      }

      if (request.status !== 'RETURNED_FOR_REVISION') {
        throw new Error('Only requests returned for revision can be edited.');
      }

      this.controlNumber = request.controlNumber;
      this.requestDate = request.requestDate;
      this.selectedBranchId = request.branchId;
      this.department = request.department;
      this.preparedBy = request.preparedBy;
      this.remarks = request.remarks;

      this.items = request.items.length
        ? request.items.map((item) => ({ ...item }))
        : [];

      if (this.items.length === 0) {
        this.addItem();
      }
    } catch (error) {
      this.loadExistingError.set(
        error instanceof Error ? error.message : 'Unable to load the purchase request.',
      );
    } finally {
      this.loadingExisting.set(false);
    }
  }

  async loadBranches() {
    this.loadingBranches.set(true);

    this.loadError.set('');

    try {
      this.branches.set(await this.service.getBranches());
    } catch (error) {
      this.loadError.set(
        error instanceof Error ? error.message : 'Unable to load branches.'
      );
    } finally {
      this.loadingBranches.set(false);
    }
  }

  addItem() {
    this.items.push({
      description: '',

      quantity: 0,

      unit: 'Vial',

      currentStock: 0,

      expectedConsumption: 0,

      justification: '',

      unitCost: 0,

      totalCost: 0,
    });
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  calculate(item: PurchaseRequestItem) {
    item.totalCost = Number(item.quantity || 0) * Number(item.unitCost || 0);
  }

  get grandTotal() {
    return this.items.reduce(
      (total, item) => total + Number(item.totalCost || 0),

      0,
    );
  }

  async submit() {
    if (this.submitting()) {
      return;
    }

    if (!this.selectedBranchId) {
      alert('Please select a branch.');

      return;
    }

    if (!this.department.trim()) {
      alert('Department is required.');

      return;
    }

    if (!this.preparedBy.trim()) {
      alert('Prepared By is required.');

      return;
    }

    const branch = this.branches().find((b) => b.id === this.selectedBranchId);

    if (!branch) {
      alert('Invalid branch.');

      return;
    }

    const validItems = this.items.filter(
      (item) => item.description.trim() !== '' && Number(item.quantity) > 0,
    );

    if (validItems.length === 0) {
      alert('Add at least one requested item.');

      return;
    }

    const isEdit = this.editMode();

    const confirmed = await this.confirmService.confirm({
      title: isEdit ? 'Resubmit Purchase Request' : 'Submit Purchase Request',
      message: isEdit
        ? `Resubmit ${this.controlNumber} for Regional Nurse Supervisor review?`
        : `Submit ${this.controlNumber} for Regional Nurse Supervisor review? You won't be able to edit it once submitted.`,
      confirmLabel: isEdit ? 'Resubmit Request' : 'Submit Request',
    });

    if (!confirmed) {
      return;
    }

    this.submitting.set(true);

    try {
      if (isEdit) {
        const id = this.editId()!;

        await this.service.updatePurchaseRequest(id, {
          requestDate: this.requestDate,
          branchId: branch.id!,
          branchName: branch.name,
          headquartersId: branch.headquartersId,
          headquartersName: branch.headquartersName,
          districtManagerId: branch.districtManagerId,
          districtManagerName: branch.districtManagerName,
          department: this.department,
          preparedBy: this.preparedBy,
          items: validItems,
          totalAmount: this.grandTotal,
          remarks: this.remarks,
        });

        await this.service.resubmitPurchaseRequest(id, this.preparedBy);

        alert(`${this.controlNumber} resubmitted successfully for RNS review.`);

        this.router.navigate(['/purchase-requests', id]);
      } else {
        const request: PurchaseRequest = {
          controlNumber: this.controlNumber,

          requestDate: this.requestDate,

          branchId: branch.id!,

          branchName: branch.name,

          headquartersId: branch.headquartersId,

          headquartersName: branch.headquartersName,

          districtManagerId: branch.districtManagerId,

          districtManagerName: branch.districtManagerName,

          department: this.department,

          preparedBy: this.preparedBy,

          items: validItems,

          totalAmount: this.grandTotal,

          remarks: this.remarks,

          status: 'DRAFT',
        };

        const id = await this.service.createPurchaseRequest(request);

        await this.service.submitPurchaseRequest(id, this.preparedBy);

        alert(`${this.controlNumber} submitted successfully for RNS review.`);

        this.router.navigate(['/purchase-requests']);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to submit the Purchase Request.');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel() {
    if (this.editMode() && this.editId()) {
      this.router.navigate(['/purchase-requests', this.editId()]);
    } else {
      this.router.navigate(['/purchase-requests']);
    }
  }
}

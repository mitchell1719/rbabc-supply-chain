import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { SupplyChainService } from '../../services/supply-chain.service';

import { AuthService } from '../../services/auth.service';

import { Branch, PurchaseRequest, PurchaseRequestItem } from '../../models/supply-chain.model';

@Component({
  selector: 'app-new-purchase-request',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './new-purchase-request.html',

  styleUrl: './new-purchase-request.css',
})
export class NewPurchaseRequest implements OnInit {
  branches: Branch[] = [];

  selectedBranchId = '';

  department = '';

  preparedBy = '';

  remarks = '';

  controlNumber = '';

  requestDate = new Date().toISOString().substring(0, 10);

  items: PurchaseRequestItem[] = [];

  loadingBranches = false;

  loadError = '';

  submitting = false;

  constructor(
    private service: SupplyChainService,

    private auth: AuthService,

    private router: Router,
  ) {}

  async ngOnInit() {
    this.controlNumber = this.service.createTemporaryControlNumber('PR');

    this.preparedBy = this.auth.displayName();

    for (let i = 0; i < 3; i++) {
      this.addItem();
    }

    await this.loadBranches();
  }

  async loadBranches() {
    this.loadingBranches = true;

    this.loadError = '';

    try {
      this.branches = await this.service.getBranches();
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'Unable to load branches.';
    } finally {
      this.loadingBranches = false;
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
    if (this.submitting) {
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

    const branch = this.branches.find((b) => b.id === this.selectedBranchId);

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

    this.submitting = true;

    try {
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

      alert(`${this.controlNumber} submitted successfully for DM approval.`);

      this.router.navigate(['/purchase-requests']);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to submit the Purchase Request.');
    } finally {
      this.submitting = false;
    }
  }

  cancel() {
    this.router.navigate(['/purchase-requests']);
  }
}

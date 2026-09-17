import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  LoadingSkeleton
} from '../../components/loading-skeleton/loading-skeleton';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-soa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSkeleton,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './soa.html',
  styleUrl: './soa.css'
})
export class Soa
implements OnInit {

  records: any[] = [];

  loading = true;

  saving = false;

  form = {

    districtManagerName: '',

    branchName: '',

    reference: '',

    totalAmount: 0,

    preparedBy: ''

  };

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    try {

      this.records =
        await this.service
          .getSOA();

    } finally {

      this.loading = false;

    }

  }

  async create() {

    if (
      !this.form.districtManagerName.trim()
    ) {

      alert(
        'District Manager is required.'
      );

      return;
    }

    this.saving = true;

    try {

      await this.service
        .createSOA({
          ...this.form
        });

      this.form = {

        districtManagerName: '',

        branchName: '',

        reference: '',

        totalAmount: 0,

        preparedBy: ''

      };

      await this.load();

    } finally {

      this.saving = false;

    }

  }

}
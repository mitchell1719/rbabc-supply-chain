import {
  Component,
  OnInit,
  signal
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
  StatementOfAccount
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

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
    DataState,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './soa.html',
  styleUrl: './soa.css'
})
export class Soa
implements OnInit {

  readonly records = signal<StatementOfAccount[]>([]);

  form = {

    districtManagerName: '',

    branchName: '',

    reference: '',

    totalAmount: 0,

    preparedBy: ''

  };

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly saving = signal(false);

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      this.records.set(
        await this.service
          .getSOA()
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load statements of account.'
      );

    } finally {

      this.loading.set(false);

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

    this.saving.set(true);

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

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to create statement of account.'
      );

    } finally {

      this.saving.set(false);

    }

  }

}

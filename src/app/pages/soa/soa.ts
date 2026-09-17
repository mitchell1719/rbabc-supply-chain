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

@Component({
  selector: 'app-soa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './soa.html',
  styleUrl: './soa.css'
})
export class Soa
implements OnInit {

  records: any[] = [];

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

    this.records =
      await this.service
        .getSOA();

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

  }

}
import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {

  inventory: any[] = [];

  search = '';

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.inventory =
      await this.service
        .getInventory();

  }

  get filtered() {

    const keyword =
      this.search
        .trim()
        .toLowerCase();

    if (!keyword) {
      return this.inventory;
    }

    return this.inventory.filter(
      item =>
        item.productName
          ?.toLowerCase()
          .includes(keyword)

        ||

        item.locationName
          ?.toLowerCase()
          .includes(keyword)

        ||

        item.batchNumber
          ?.toLowerCase()
          .includes(keyword)
    );

  }

  getStatus(item: any) {

    if (
      Number(item.quantity) === 0
    ) {
      return 'Critical';
    }

    if (
      Number(item.quantity) <=
      Number(item.reorderLevel)
    ) {
      return 'Low Stock';
    }

    return 'In Stock';

  }

}
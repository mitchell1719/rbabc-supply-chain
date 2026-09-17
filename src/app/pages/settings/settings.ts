import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { SupplyChainService } from '../../services/supply-chain.service';

import { DataState } from '../../components/data-state/data-state';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, DataState],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {

  companyName = 'RB ABC Holding OPC';

  department = 'Supply Chain Office';

  systemName = 'Supply Chain Management System';

  loading = false;

  errorMessage = '';

  saving = false;

  successMessage = '';

  constructor(private service: SupplyChainService) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading = true;

    this.errorMessage = '';

    try {
      const settings = await this.service.getSystemSettings();

      if (settings) {
        this.companyName = settings.companyName;

        this.department = settings.department;

        this.systemName = settings.systemName;
      }
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Unable to load settings.';
    } finally {
      this.loading = false;
    }
  }

  async save() {
    this.successMessage = '';

    this.saving = true;

    try {
      await this.service.saveSystemSettings({
        companyName: this.companyName,
        department: this.department,
        systemName: this.systemName,
      });

      this.successMessage = 'Settings saved successfully.';
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save settings.');
    } finally {
      this.saving = false;
    }
  }

}

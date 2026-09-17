import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { SupplyChainService } from '../../services/supply-chain.service';

import { ThemeService } from '../../services/theme.service';
import { ConfirmService } from '../../services/confirm.service';
import { AuthService } from '../../services/auth.service';

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

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordMessage = '';
  passwordError = '';

  changingPassword = false;

  constructor(
    private service: SupplyChainService,

    public theme: ThemeService,

    private confirmService: ConfirmService,

    private auth: AuthService,
  ) {}

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

  async updatePassword() {
    this.passwordMessage = '';
    this.passwordError = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Please fill in all password fields.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.passwordError = 'New password must be at least 8 characters.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    const confirmed = await this.confirmService.confirm({
      title: 'Change Password',
      message: 'Are you sure you want to change your account password? You will need the new password the next time you sign in.',
      confirmLabel: 'Change Password',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    this.changingPassword = true;

    try {
      await this.auth.changePassword(this.currentPassword, this.newPassword);

      this.passwordMessage = 'Password updated successfully.';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error) {
      this.passwordError =
        error instanceof Error ? error.message : 'Unable to change password.';
    } finally {
      this.changingPassword = false;
    }
  }

}

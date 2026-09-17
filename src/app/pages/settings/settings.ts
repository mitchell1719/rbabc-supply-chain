import { Component, OnInit, signal } from '@angular/core';

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

  readonly companyName = signal('RB ABC Holding OPC');

  readonly department = signal('Supply Chain Office');

  readonly systemName = signal('Supply Chain Management System');

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly saving = signal(false);

  readonly successMessage = signal('');

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  readonly passwordMessage = signal('');
  readonly passwordError = signal('');

  readonly changingPassword = signal(false);

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
    this.loading.set(true);

    this.errorMessage.set('');

    try {
      const settings = await this.service.getSystemSettings();

      if (settings) {
        this.companyName.set(settings.companyName);

        this.department.set(settings.department);

        this.systemName.set(settings.systemName);
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load settings.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    this.successMessage.set('');

    this.saving.set(true);

    try {
      await this.service.saveSystemSettings({
        companyName: this.companyName(),
        department: this.department(),
        systemName: this.systemName(),
      });

      this.successMessage.set('Settings saved successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save settings.');
    } finally {
      this.saving.set(false);
    }
  }

  async updatePassword() {
    this.passwordMessage.set('');
    this.passwordError.set('');

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError.set('Please fill in all password fields.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.passwordError.set('New password must be at least 8 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('New password and confirmation do not match.');
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

    this.changingPassword.set(true);

    try {
      await this.auth.changePassword(this.currentPassword, this.newPassword);

      this.passwordMessage.set('Password updated successfully.');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error) {
      this.passwordError.set(
        error instanceof Error ? error.message : 'Unable to change password.',
      );
    } finally {
      this.changingPassword.set(false);
    }
  }

}

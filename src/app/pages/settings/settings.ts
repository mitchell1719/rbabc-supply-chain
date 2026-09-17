import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ThemeService } from '../../services/theme.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {

  companyName =
    'RB ABC Holding OPC';

  department =
    'Supply Chain Office';

  systemName =
    'Supply Chain Management System';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordMessage = '';
  passwordError = '';

  constructor(
    public theme: ThemeService,
    private confirmService: ConfirmService,
  ) {}

  save() {

    alert(
      'Settings saved locally for this UI. Connect this page to Firestore systemSettings before production.'
    );

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

    this.passwordMessage = 'Password updated locally for this UI. Connect this action to Firebase Authentication before production.';
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

}

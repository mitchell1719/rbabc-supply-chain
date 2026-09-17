import { Component, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

type AuthMode = 'signIn' | 'signUp';

@Component({
  selector: 'app-login',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './login.html',

  styleUrl: './login.css',
})
export class Login {
  mode: AuthMode = 'signIn';

  fullName = '';

  email = '';

  password = '';

  confirmPassword = '';

  readonly submitting = signal(false);

  readonly errorMessage = signal('');

  constructor(
    private auth: AuthService,

    private router: Router,

    private route: ActivatedRoute,
  ) {}

  setMode(mode: AuthMode) {
    this.mode = mode;

    this.errorMessage.set('');
  }

  private validate(): string {
    if (!this.email.trim()) {
      return 'Email is required.';
    }

    if (!this.password) {
      return 'Password is required.';
    }

    if (this.mode === 'signUp') {
      if (!this.fullName.trim()) {
        return 'Full name is required.';
      }

      if (this.password.length < 6) {
        return 'Password must be at least 6 characters.';
      }

      if (this.password !== this.confirmPassword) {
        return 'Passwords do not match.';
      }
    }

    return '';
  }

  async submit() {
    this.errorMessage.set('');

    const validationError = this.validate();

    if (validationError) {
      this.errorMessage.set(validationError);

      return;
    }

    this.submitting.set(true);

    try {
      if (this.mode === 'signIn') {
        await this.auth.signIn(this.email, this.password);
      } else {
        await this.auth.signUp(this.email, this.password, this.fullName);
      }

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

      this.router.navigateByUrl(returnUrl);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to complete the request.',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}

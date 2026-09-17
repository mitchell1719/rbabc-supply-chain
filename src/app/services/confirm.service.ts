import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends Required<ConfirmOptions> {
  open: boolean;
}

const DEFAULT_STATE: ConfirmState = {
  open: false,
  title: 'Please Confirm',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
};

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  readonly state = signal<ConfirmState>(DEFAULT_STATE);

  private resolver: ((value: boolean) => void) | null = null;

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.state.set({
      open: true,
      title: options.title ?? DEFAULT_STATE.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? DEFAULT_STATE.confirmLabel,
      cancelLabel: options.cancelLabel ?? DEFAULT_STATE.cancelLabel,
      danger: options.danger ?? DEFAULT_STATE.danger,
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  respond(result: boolean): void {
    this.state.update((current) => ({ ...current, open: false }));
    this.resolver?.(result);
    this.resolver = null;
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { CreateToastPayload, ToastNotification, ToastType } from './toast.model';

const DEFAULT_DURATION_MS = 4000;

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<ToastNotification[]>([]);
  private readonly dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly toasts$ = this.toastsSubject.asObservable();

  success(payload: CreateToastPayload): void {
    this.show('success', payload);
  }

  error(payload: CreateToastPayload): void {
    this.show('error', payload);
  }

  warning(payload: CreateToastPayload): void {
    this.show('warning', payload);
  }

  info(payload: CreateToastPayload): void {
    this.show('info', payload);
  }

  dismiss(toastId: string): void {
    const timeout = this.dismissTimers.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      this.dismissTimers.delete(toastId);
    }

    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== toastId));
  }

  clear(): void {
    this.dismissTimers.forEach((timer) => clearTimeout(timer));
    this.dismissTimers.clear();
    this.toastsSubject.next([]);
  }

  private show(type: ToastType, payload: CreateToastPayload): void {
    const toast: ToastNotification = {
      id: this.createId(),
      type,
      title: payload.title,
      message: payload.message,
      durationMs: payload.durationMs ?? DEFAULT_DURATION_MS,
    };

    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    if (toast.durationMs > 0) {
      const dismissTimer = setTimeout(() => this.dismiss(toast.id), toast.durationMs);
      this.dismissTimers.set(toast.id, dismissTimer);
    }
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

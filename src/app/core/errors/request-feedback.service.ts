import { Injectable } from '@angular/core';

import { ToastService } from '../notifications/toast.service';
import { resolveErrorMessage } from '../api/utils/api-error.util';

@Injectable({ providedIn: 'root' })
export class RequestFeedbackService {
  constructor(private readonly toastService: ToastService) {}

  resolveMessage(error: unknown, fallbackMessage: string): string {
    return resolveErrorMessage(error, fallbackMessage);
  }

  showError(title: string, error: unknown, fallbackMessage: string): void {
    this.toastService.error({
      title,
      message: this.resolveMessage(error, fallbackMessage),
    });
  }
}

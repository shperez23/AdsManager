export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  readonly id: string;
  readonly type: ToastType;
  readonly title: string;
  readonly message?: string;
  readonly durationMs: number;
}

export interface CreateToastPayload {
  readonly title: string;
  readonly message?: string;
  readonly durationMs?: number;
}

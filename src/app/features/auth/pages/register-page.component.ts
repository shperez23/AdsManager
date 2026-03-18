import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, finalize } from 'rxjs';

import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { ToastService } from '../../../core/notifications/toast.service';
import {
  buildRegisterPayload,
  extractApiErrorMessage,
  slugifyTenantName,
} from '../../../shared/utils/auth-form.util';

const TENANT_SLUG_PATTERN = '^[a-z0-9]+(?:-[a-z0-9]+)*$';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  isSubmitting = false;

  readonly form = this.formBuilder.group({
    tenantName: ['', [Validators.required]],
    tenantSlug: ['', [Validators.required, Validators.pattern(TENANT_SLUG_PATTERN)]],
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.form.controls.tenantName.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((tenantName) => {
        const tenantSlugControl = this.form.controls.tenantSlug;
        if (tenantSlugControl.dirty) {
          return;
        }

        tenantSlugControl.setValue(slugifyTenantName(tenantName), { emitEvent: false });
      });
  }

  normalizeTenantSlug(): void {
    const tenantSlugControl = this.form.controls.tenantSlug;
    tenantSlugControl.setValue(slugifyTenantName(tenantSlugControl.value), { emitEvent: false });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.normalizeTenantSlug();
    this.isSubmitting = true;

    this.authSessionService
      .register(buildRegisterPayload(this.form.getRawValue()))
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastService.success({
            title: 'Cuenta creada',
            message: 'Registro exitoso. Ya puedes usar la plataforma.',
          });
          this.router.navigateByUrl('/');
        },
        error: (error) => {
          this.toastService.error({
            title: 'Registro fallido',
            message: extractApiErrorMessage(
              error,
              'No se pudo completar el registro. Revisa los datos e intenta nuevamente.',
            ),
          });
        },
      });
  }
}

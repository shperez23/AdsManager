import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { ToastService } from '../../../core/notifications/toast.service';

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

  isSubmitting = false;

  readonly form = this.formBuilder.group({
    tenantName: ['', [Validators.required]],
    tenantSlug: ['', [Validators.required]],
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authSessionService
      .register({
        tenantName: this.form.value.tenantName ?? undefined,
        tenantSlug: this.form.value.tenantSlug ?? undefined,
        name: this.form.value.name ?? undefined,
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? '',
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastService.success({
            title: 'Cuenta creada',
            message: 'Registro exitoso. Ya puedes usar Ads Manager.',
          });
          this.router.navigateByUrl('/');
        },
        error: () => {
          this.toastService.error({
            title: 'Registro fallido',
            message: 'No se pudo completar el registro. Revisa los datos e intenta nuevamente.',
          });
        },
      });
  }
}

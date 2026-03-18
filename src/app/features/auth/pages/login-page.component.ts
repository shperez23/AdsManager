import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { ToastService } from '../../../core/notifications/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isSubmitting = false;

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = this.form.getRawValue();
    const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl') ?? '/';

    this.authSessionService
      .login({
        email: payload.email ?? '',
        password: payload.password ?? '',
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastService.success({
            title: 'Bienvenido',
            message: 'Inicio de sesión exitoso.',
          });
          this.router.navigateByUrl(returnUrl);
        },
        error: () => {
          this.toastService.error({
            title: 'Error de autenticación',
            message: 'No se pudo iniciar sesión. Verifica tus credenciales.',
          });
        },
      });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = null;

    const payload = this.form.getRawValue();

    this.auth.register({
      email: payload.email!,
      password: payload.password!,
      username: payload.username || undefined
    }).subscribe({
      next: () => {
        // intentar auto-login
        this.auth.login({ email: payload.email!, password: payload.password! }).subscribe({
          next: () => { this.loading = false; this.router.navigateByUrl('/'); },
          error: () => { this.loading = false; this.router.navigateByUrl('/login'); }
        });
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'No se pudo registrar';
      }
    });
  }
}

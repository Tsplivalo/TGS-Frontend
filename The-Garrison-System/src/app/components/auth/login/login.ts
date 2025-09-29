import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMsg: string | null = null;
  showPassword = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  get f() { return this.form.controls; }

  toggleShowPassword() { this.showPassword = !this.showPassword; }

  submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMsg = null;

    const payload = {
      email: this.f.email.value!.trim(),
      password: this.f.password.value!
    };

    this.auth.login(payload).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => {
        const apiMsg =
          e?.error?.message || e?.error?.mensaje || e?.error?.error ||
          (Array.isArray(e?.error?.errores) && e.error.errores[0]?.message) ||
          e?.message;
        this.errorMsg = apiMsg ? String(apiMsg) : 'No se pudo iniciar sesión.';
      }
    }).add(() => this.loading = false);
  }
}

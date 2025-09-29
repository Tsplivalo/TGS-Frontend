import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      // misma regla del backend: mayúscula, minúscula, número y caracter especial
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+/)
    ]],
  });

  loading = false;
  errorMsg: string | null = null;

  submit() {
    if (this.form.invalid) return;
    this.loading = true; this.errorMsg = null;

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        // tras crear usuario, llevamos a login
        this.router.navigateByUrl('/login');
      },
      error: (e) => {
        this.errorMsg = 'No se pudo registrar. Verificá los datos.';
      }
    }).add(() => this.loading = false);
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
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

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  errorMsg: string | null = null;

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = null;

    this.auth.login(this.form.getRawValue());
    // Manejo de error simple (como el login devuelve subscribe en el service, podrías mover el manejo aquí si preferís).
    setTimeout(() => this.loading = false, 600);
  }
}

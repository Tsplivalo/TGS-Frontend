// src/app/pages/auth/register/register.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error: string | null = null;

  form = this.fb.group({
    username: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100)
    ]],
    email: ['', [
      Validators.required,
      Validators.email
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      this.passwordValidator
    ]],
  });

  /**
   * Validador personalizado para la contraseña
   * Debe contener: mayúscula, minúscula, número y carácter especial
   */
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[@$!%*?&]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    if (!passwordValid) {
      return {
        passwordStrength: {
          message: 'La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)'
        }
      };
    }

    return null;
  }

  submit(): void {
    // Validar formulario
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationErrors();
      return;
    }

    this.loading = true;
    this.error = null;

    const { username, email, password } = this.form.getRawValue();

    this.auth.register({
      username: username!,
      email: email!,
      password: password!
    }).subscribe({
      next: () => {
        console.log('[Register] Success, attempting auto-login...');
        
        // Intentar auto-login después del registro
        this.auth.login({
          email: email!,
          password: password!
        }).subscribe({
          next: (user) => {
            this.loading = false;
            console.log('[Register] Auto-login success:', user);
            this.router.navigateByUrl('/');
          },
          error: (err) => {
            this.loading = false;
            console.error('[Register] Auto-login failed:', err);
            // Si falla el auto-login, redirigir a login manual
            this.router.navigate(['/login'], {
              queryParams: { message: 'Registro exitoso. Por favor, inicia sesión.' }
            });
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'No se pudo registrar';
        console.error('[Register] Error:', err);
      }
    });
  }

  /**
   * Muestra errores de validación específicos
   */
  private showValidationErrors(): void {
    const usernameControl = this.form.get('username');
    const emailControl = this.form.get('email');
    const passwordControl = this.form.get('password');

    if (usernameControl?.errors) {
      if (usernameControl.errors['required']) {
        this.error = 'El nombre de usuario es requerido';
      } else if (usernameControl.errors['minlength']) {
        this.error = 'El nombre de usuario debe tener al menos 2 caracteres';
      }
      return;
    }

    if (emailControl?.errors) {
      if (emailControl.errors['required']) {
        this.error = 'El email es requerido';
      } else if (emailControl.errors['email']) {
        this.error = 'El email no es válido';
      }
      return;
    }

    if (passwordControl?.errors) {
      if (passwordControl.errors['required']) {
        this.error = 'La contraseña es requerida';
      } else if (passwordControl.errors['minlength']) {
        this.error = 'La contraseña debe tener al menos 8 caracteres';
      } else if (passwordControl.errors['passwordStrength']) {
        this.error = passwordControl.errors['passwordStrength'].message;
      }
      return;
    }
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['required']) return 'Este campo es requerido';
    if (errors['email']) return 'Email inválido';
    if (errors['minlength']) {
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    }
    if (errors['passwordStrength']) {
      return errors['passwordStrength'].message;
    }

    return 'Campo inválido';
  }

  /**
   * Limpia el mensaje de error
   */
  clearError(): void {
    this.error = null;
  }
}
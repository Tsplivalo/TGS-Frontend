import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';

/**
 * LoginComponent
 *
 * Formulario mínimo de inicio de sesión con validación reactiva, indicador de carga,
 * manejo compacto de errores de API y conmutación de visibilidad de contraseña.
 * Navega a "/" tras un login exitoso.
 */
@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  // --- Inyección de dependencias ---
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);

  // --- Estado UI ---
  loading = false;                // deshabilita submit y muestra spinner
  errorMsg: string | null = null; // clave i18n o texto plano retornado por API
  showPassword = false;           // conmutador de visibilidad del campo contraseña

  // --- Animación Star Wars ---
  animatedPlaceholder = '';
  private starWarsEmails = [
    'anakinsky@theforce.com',
    'lukeskywalker@jedi.com',
    'leia@rebellion.com',
    'obiwan@jedi.com',
    'yoda@dagobah.com',
    'darthvader@empire.com',
    'han@millennium.com',
    'chewbacca@kashyyyk.com'
  ];
  private currentEmailIndex = 0;
  private animationInterval: any;
  private isTyping = false;
  private userIsTyping = false;

  // --- Formulario reactivo ---
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  // Acceso corto a los controles (plantilla/TS)
  get f() { return this.form.controls; }

  // Mostrar/ocultar contraseña
  toggleShowPassword() { this.showPassword = !this.showPassword; }

  // --- Ciclo de vida ---
  ngOnInit() {
    console.log('LoginComponent ngOnInit - Iniciando animación Star Wars');
    this.startStarWarsAnimation();
  }

  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  // --- Animación Star Wars ---
  private startStarWarsAnimation() {
    console.log('Iniciando animación Star Wars');
    
    // Versión simple: cambiar placeholder cada 2 segundos
    this.animatedPlaceholder = this.starWarsEmails[0];
    console.log('Placeholder inicial:', this.animatedPlaceholder);
    
    this.animationInterval = setInterval(() => {
      this.currentEmailIndex = (this.currentEmailIndex + 1) % this.starWarsEmails.length;
      this.animatedPlaceholder = this.starWarsEmails[this.currentEmailIndex];
      console.log('Cambiando placeholder a:', this.animatedPlaceholder);
    }, 2000); // Cambiar cada 2 segundos
  }

  // Métodos para pausar/reanudar animación cuando el usuario escribe
  onEmailFocus() {
    this.userIsTyping = true;
  }

  onEmailBlur() {
    // Reanudar animación después de un delay
    setTimeout(() => {
      this.userIsTyping = false;
    }, 1000);
  }

  private async typeEmail() {
    if (this.isTyping) return;
    
    this.isTyping = true;
    const email = this.starWarsEmails[this.currentEmailIndex];
    console.log('Escribiendo email:', email);
    
    // Escribir email con velocidad variable (más lento al principio, más rápido al final)
    await this.typeTextWithVariableSpeed(email);
    
    // Esperar un poco para que se lea
    await this.delay(2000);
    
    // Borrar email más rápido
    await this.deleteText(email.length, 40);
    
    // Cambiar al siguiente email
    this.currentEmailIndex = (this.currentEmailIndex + 1) % this.starWarsEmails.length;
    this.isTyping = false;
  }

  private async typeText(text: string, speed: number): Promise<void> {
    for (let i = 0; i <= text.length; i++) {
      this.animatedPlaceholder = text.substring(0, i);
      await this.delay(speed);
    }
  }

  private async typeTextWithVariableSpeed(text: string): Promise<void> {
    for (let i = 0; i <= text.length; i++) {
      this.animatedPlaceholder = text.substring(0, i);
      console.log('Escribiendo:', this.animatedPlaceholder);
      
      // Velocidad más rápida para testing
      let speed = 100; // velocidad base más rápida
      if (i < text.length * 0.3) {
        speed = 120; // más lento al principio
      } else if (i > text.length * 0.7) {
        speed = 60; // más rápido al final
      }
      
      // Pausas especiales en caracteres importantes
      if (text[i] === '@' || text[i] === '.') {
        speed = 150; // pausa más larga en @ y .
      }
      
      await this.delay(speed);
    }
  }

  private async deleteText(length: number, speed: number): Promise<void> {
    for (let i = length; i >= 0; i--) {
      this.animatedPlaceholder = this.animatedPlaceholder.substring(0, i);
      await this.delay(speed);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Envío del formulario ---
  submit() {
    if (this.form.invalid || this.loading) return; // evita reentradas y envíos inválidos
    this.loading = true;
    this.errorMsg = null;

    // Normalización de payload (trim en email, password tal cual)
    const payload = {
      email: this.f.email.value!.trim(),
      password: this.f.password.value!
    };

    this.auth.login(payload).subscribe({
      next: () => this.router.navigateByUrl('/'), // redirigir tras éxito
      error: (e) => {
        // Extrae mensaje útil desde varios formatos de error habituales
        const apiMsg =
          e?.error?.message || e?.error?.mensaje || e?.error?.error ||
          (Array.isArray(e?.error?.errores) && e.error.errores[0]?.message) ||
          e?.message;
        this.errorMsg = apiMsg ? String(apiMsg) : 'auth.errors.loginFailed';
      }
    }).add(() => this.loading = false); // siempre liberar loading
  }
}

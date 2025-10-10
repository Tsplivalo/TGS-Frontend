import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// Servicios propios
import { AuthService } from '../../services/auth/auth';

// i18n (solo pipe)
import { TranslateModule } from '@ngx-translate/core';

/**
 * HomeComponent
 *
 * Muestra el panel de autenticación (login/registro) cuando el usuario NO está logueado
 * y lo oculta con una breve animación cuando inicia sesión. Incluye tarjetas de features
 * con soporte i18n y accesibilidad básica (tecla Enter/Espacio para expandir).
 */

type IntroItem = { titleKey: string; detailKey: string };

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent {
  // --- Inyección de dependencias ---
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // --- Estado de autenticación (expuesto por AuthService como signals) ---
  readonly isLoggedIn = this.auth.isLoggedIn;   // signal<boolean>
  readonly user       = this.auth.user;         // signal<{ username?: string } | null>

  // --- Estado visual del panel auth ---
  showAuthPanel = true;   // controla visibilidad del panel
  entering = false;       // flag para animación de entrada
  hiding   = false;       // flag para animación de salida

  // --- Modo del panel (login | register) ---
  mode = signal<'login' | 'register'>('login');
  setMode(m: 'login' | 'register') { this.mode.set(m); }

  // --- Logo (fallback simple si falla la carga) ---
  logoOk = true;
  onLogoError() { this.logoOk = false; }

  // --- Formularios reactivos ---
  // Campos mínimos y validaciones razonables; el backend valida definitivamente.
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // --- Estado de envío / error por acción ---
  loadingLogin    = false;
  loadingRegister = false;
  errorLogin: string | null = null;     // claves i18n o mensajes planos
  errorRegister: string | null = null;  // idem

  // --- Contenido de introducción (claves i18n) ---
  introItems: IntroItem[] = [
    { titleKey: 'home.features.simplified.title',  detailKey: 'home.features.simplified.detail' },
    { titleKey: 'home.features.performance.title', detailKey: 'home.features.performance.detail' },
    { titleKey: 'home.features.scalable.title',    detailKey: 'home.features.scalable.detail' },
    { titleKey: 'home.features.reports.title',     detailKey: 'home.features.reports.detail' },
    { titleKey: 'home.features.security.title',    detailKey: 'home.features.security.detail' },
    { titleKey: 'home.features.integrations.title',detailKey: 'home.features.integrations.detail' },
  ];

  // --- Expand/Collapse de cards (con soporte de teclado) ---
  flipped = new Set<number>();
  toggleFlip(i: number, ev?: Event) {
    ev?.preventDefault();
    if (this.flipped.has(i)) this.flipped.delete(i);
    else this.flipped.add(i);
  }
  onCardKey(i: number, ev: KeyboardEvent) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.toggleFlip(i);
    }
  }

  // --- Derivado: mostrar panel si NO hay sesión ---
  private _shouldShowAuth = computed(() => !this.isLoggedIn());

  constructor() {
    // Reacciona a cambios de sesión para disparar animaciones de entrada/salida del panel.
    effect(() => {
      const logged = this.isLoggedIn();
      const mustShow = !logged;

      if (mustShow && !this.showAuthPanel) {
        // Mostrar con micro-animación
        this.entering = true;
        this.showAuthPanel = true;
        queueMicrotask(() => setTimeout(() => (this.entering = false), 200));
      } else if (!mustShow && this.showAuthPanel) {
        // Ocultar con breve salida
        this.hiding = true;
        setTimeout(() => {
          this.showAuthPanel = false;
          this.hiding = false;
        }, 220);
      }
    });
  }

  // --- LOGIN ---
  async submitLogin() {
    this.errorLogin = null;
    this.loadingLogin = true;

    try {
      const { email, password } = this.loginForm.getRawValue();
      if (!email || !password) throw new Error('auth.errors.missingFields');

      await firstValueFrom(this.auth.login({ email, password }));

      // Ocultar panel tras login exitoso
      this.hiding = true;
      setTimeout(() => {
        this.showAuthPanel = false;
        this.hiding = false;
      }, 180);
    } catch (e: any) {
      // Si llega una clave i18n, la UI puede traducirla; si no, mostrar texto tal cual.
      this.errorLogin = e?.message || 'auth.errors.loginFailed';
    } finally {
      this.loadingLogin = false;
    }
  }

  // --- REGISTER (+ auto login) ---
  async submitRegister() {
    this.errorRegister = null;
    this.loadingRegister = true;

    try {
      const { username, email, password } = this.registerForm.getRawValue();
      if (!username || !email || !password) throw new Error('auth.errors.missingFields');

      await firstValueFrom(this.auth.register({ username, email, password }));
      await firstValueFrom(this.auth.login({ email, password }));

      // Ocultar panel tras registro + login
      this.hiding = true;
      setTimeout(() => {
        this.showAuthPanel = false;
        this.hiding = false;
      }, 180);
    } catch (e: any) {
      this.errorRegister = e?.message || 'auth.errors.registerFailed';
    } finally {
      this.loadingRegister = false;
    }
  }

  // --- CTA: navegación a la tienda ---
  goStore() {
    this.router.navigateByUrl('/tienda');
  }
}

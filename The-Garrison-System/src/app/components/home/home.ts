import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Ajustá estos imports al AuthService que ya tenés en tu proyecto:
import { AuthService } from '../../services/auth/auth';

type IntroItem = { title: string; detail: string };

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Signals de auth (misma interfaz que el navbar)
  readonly isLoggedIn = this.auth.isLoggedIn;   // signal<boolean>
  readonly user       = this.auth.user;         // signal<{ username?: string }|null>

  // Estado visual del panel auth
  showAuthPanel = true;
  entering = false;
  hiding   = false;

  // Modo del panel
  mode = signal<'login' | 'register'>('login');
  setMode(m: 'login' | 'register') { this.mode.set(m); }

  // Logo
  logoOk = true;
  onLogoError() { this.logoOk = false; }

  // Forms
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Estados de envío / errores
  loadingLogin    = false;
  loadingRegister = false;
  errorLogin: string | null = null;
  errorRegister: string | null = null;

  // 🔹 Intro: ahora 6 tarjetas
  introItems: IntroItem[] = [
    {
      title: 'Gestión simplificada',
      detail: 'Unificá productos, clientes y ventas en una sola interfaz, con flujos claros y métricas accionables.',
    },
    {
      title: 'Rendimiento y claridad',
      detail: 'Pantallas ágiles, estados bien definidos y filtros que ayudan a decidir más rápido y mejor.',
    },
    {
      title: 'Listo para escalar',
      detail: 'Organizá zonas, autoridades y decisiones con controles que crecen con tu operación.',
    },
    {
      title: 'Reportes en tiempo real',
      detail: 'Visualizá KPIs y tendencias al instante para detectar oportunidades y anticipar desvíos.',
    },
    {
      title: 'Seguridad y roles',
      detail: 'Definí permisos por área o función para cuidar la información y ordenar el trabajo.',
    },
    {
      title: 'Integraciones y API',
      detail: 'Conectá tus sistemas, importá datos y automatizá procesos sin fricción.',
    },
  ];

  // Control expand/collapse en las cards
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

  // Mostrar/ocultar panel según auth
  private _shouldShowAuth = computed(() => !this.isLoggedIn());

  constructor() {
    // Reaccionar a cambios de login con pequeñas animaciones
    effect(() => {
      const logged = this.isLoggedIn();
      const mustShow = !logged;

      if (mustShow && !this.showAuthPanel) {
        this.entering = true;
        this.showAuthPanel = true;
        queueMicrotask(() => setTimeout(() => (this.entering = false), 200));
      } else if (!mustShow && this.showAuthPanel) {
        this.hiding = true;
        setTimeout(() => {
          this.showAuthPanel = false;
          this.hiding = false;
        }, 220);
      }
    });
  }

  // LOGIN
  async submitLogin() {
    this.errorLogin = null;
    this.loadingLogin = true;

    try {
      const { email, password } = this.loginForm.getRawValue();
      if (!email || !password) throw new Error('Completá email y contraseña.');

      await this.auth.login({ email, password });

      this.hiding = true;
      setTimeout(() => {
        this.showAuthPanel = false;
        this.hiding = false;
      }, 180);
    } catch (e: any) {
      this.errorLogin = e?.message || 'No se pudo iniciar sesión.';
    } finally {
      this.loadingLogin = false;
    }
  }

  // REGISTER (+ auto-login)
  async submitRegister() {
    this.errorRegister = null;
    this.loadingRegister = true;

    try {
      const { username, email, password } = this.registerForm.getRawValue();
      if (!username || !email || !password) throw new Error('Completá todos los campos.');

      await this.auth.register({ username, email, password });
      await this.auth.login({ email, password });

      this.hiding = true;
      setTimeout(() => {
        this.showAuthPanel = false;
        this.hiding = false;
      }, 180);
    } catch (e: any) {
      this.errorRegister = e?.message || 'No se pudo registrar.';
    } finally {
      this.loadingRegister = false;
    }
  }
}

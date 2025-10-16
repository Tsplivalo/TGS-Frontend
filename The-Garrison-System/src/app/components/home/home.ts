/**
 * Componente de página principal
 * 
 * Este componente representa la página de inicio de la aplicación y proporciona:
 * - Panel de autenticación (login/registro) con animaciones
 * - Información sobre las características del sistema
 * - Navegación hacia la tienda para usuarios autenticados
 * - Gestión de estados de autenticación y verificación de email
 */
import { Component, computed, effect, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmailVerificationService } from '../../features/inbox/services/email.verification';

// Servicios propios
import { AuthService } from '../../services/auth/auth';

// i18n (solo pipe)
import { TranslateModule } from '@ngx-translate/core';

/**
 * Tipo para elementos de introducción con claves de traducción
 */
type IntroItem = { titleKey: string; detailKey: string };

/**
 * Componente de página principal
 * 
 * Standalone component que maneja la autenticación, registro y
 * presentación de características del sistema.
 */
@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private emailVerificationService = inject(EmailVerificationService);

  /**
   * Estado de autenticación usando el servicio actualizado
   */
  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly user = computed(() => this.auth.user());

  /**
   * Estados para verificación de email
   */
  needsEmailVerification = signal(false);
  resendingEmail = signal(false);
  emailSent = signal(false);


  /**
   * Control de visibilidad del panel de autenticación
   */
  showAuthPanel = true;
  entering = false;  // Estado de entrada con animación
  hiding = false;    // Estado de salida con animación

  /**
   * Modo del panel de autenticación (login o registro)
   */
  mode = signal<'login' | 'register'>('login');

  /**
   * Cambia el modo del panel y reinicia las animaciones
   * @param m - Nuevo modo: 'login' o 'register'
   */
  setMode(m: 'login' | 'register') {
    this.mode.set(m);
    this.restartAnimationForMode();
  }

  // --- Logo ---
  logoOk = true;
  onLogoError() { this.logoOk = false; }

  // --- Formularios (actualizados con validaciones del backend) ---
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]], // ← Mínimo 8 caracteres
  });

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      // Validación de complejidad de contraseña
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    ]],
  });

  // --- Estado envío / error ---
  loadingLogin = false;
  loadingRegister = false;
  errorLogin: string | null = null;
  errorRegister: string | null = null;

  // ====== PLACEHOLDERS ANIMADOS (sin genéricos) ======
  animatedPlaceholder = '';       // email (login/register)
  animatedNamePlaceholder = '';   // username (register)

  // >>> Tokens de cancelación (evita carreras entre type/delete) <<<
  private emailToken = 0;
  private nameToken = 0;
  private bumpEmailToken(): number { return ++this.emailToken; }
  private bumpNameToken(): number { return ++this.nameToken; }

  // Personajes login (solo email)
  private loginCharacters = [
    { name: 'Anakin Skywalker', email: 'anakinskywalker@theforce.com' },
    { name: 'Luke Skywalker', email: 'lukeskywalker@jedi.com' },
    { name: 'Leia Organa', email: 'leia@rebellion.com' },
    { name: 'Obi-Wan Kenobi', email: 'obiwan@jedi.com' },
    { name: 'Yoda', email: 'yoda@dagobah.com' },
    { name: 'Darth Vader', email: 'darthvader@empire.com' },
    { name: 'Han Solo', email: 'han@millennium.com' },
    { name: 'Chewbacca', email: 'chewbacca@kashyyyk.com' }
  ];
  private loginCharacterIndex = 0;

  // Personajes register (nombre + email)
  private registerCharacters = [
    { name: 'Anakin Skywalker', email: 'anakinskywalker@theforce.com' },
    { name: 'Luke Skywalker', email: 'lukeskywalker@jedi.com' },
    { name: 'Leia Organa', email: 'leia@rebellion.com' },
    { name: 'Obi-Wan Kenobi', email: 'obiwan@jedi.com' },
    { name: 'Yoda', email: 'yoda@dagobah.com' },
    { name: 'Darth Vader', email: 'darthvader@empire.com' },
    { name: 'Han Solo', email: 'han@millennium.com' },
    { name: 'Chewbacca', email: 'chewbacca@kashyyyk.com' },
    { name: 'Rey', email: 'rey@resistance.com' },
    { name: 'Kylo Ren', email: 'kyloren@firstorder.com' },
    { name: 'Padmé Amidala', email: 'padme@naboo.com' },
    { name: 'Mace Windu', email: 'macewindu@jedi.com' }
  ];
  private registerCharacterIndex = 0;

  // Flags animación
  private isTyping = false;
  private isTypingName = false;
  private isDeletingEmail = false;
  private isDeletingName = false;

  private userIsTyping = false;
  private userIsTypingName = false;

  private registerAnimationRunning = false;

  // Intro
  introItems: IntroItem[] = [
    { titleKey: 'home.features.simplified.title', detailKey: 'home.features.simplified.detail' },
    { titleKey: 'home.features.performance.title', detailKey: 'home.features.performance.detail' },
    { titleKey: 'home.features.scalable.title', detailKey: 'home.features.scalable.detail' },
    { titleKey: 'home.features.reports.title', detailKey: 'home.features.reports.detail' },
    { titleKey: 'home.features.security.title', detailKey: 'home.features.security.detail' },
    { titleKey: 'home.features.integrations.title', detailKey: 'home.features.integrations.detail' },
  ];

  // Expandibles
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

  private _shouldShowAuth = computed(() => !this.isLoggedIn());

  constructor() {
    effect(() => {
      const mustShow = !this.isLoggedIn();
      if (mustShow && !this.showAuthPanel) {
        this.entering = true;
        this.showAuthPanel = true;
        queueMicrotask(() => setTimeout(() => (this.entering = false), 200));
      } else if (!mustShow && this.showAuthPanel) {
        this.hiding = true;
        setTimeout(() => { this.showAuthPanel = false; this.hiding = false; }, 220);
      }
    });
  }

  ngOnInit() { this.startStarWarsAnimation(); }

  ngOnDestroy() {
    // invalidar todo lo pendiente
    this.bumpEmailToken();
    this.bumpNameToken();
    this.registerAnimationRunning = false;
    this.isTyping = this.isTypingName = this.isDeletingEmail = this.isDeletingName = false;
    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;
  }

  // ===== Helpers de estado anim (sin genéricos) =====
  emailAnimOn(): boolean {
    return this.isTyping || this.isDeletingEmail || !!this.animatedPlaceholder;
  }
  nameAnimOn(): boolean {
    return this.isTypingName || this.isDeletingName || !!this.animatedNamePlaceholder;
  }

  // ===== Inicio / reinicio animación =====
  private startStarWarsAnimation() {
    this.isTyping = this.isTypingName = this.isDeletingEmail = this.isDeletingName = false;
    this.registerAnimationRunning = false;

    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;

    // limpiar y empezar
    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';

    this.startAnimationForCurrentMode();
  }

  private startAnimationForCurrentMode() {
    if (this.mode() === 'login') this.startLoginAnimation();
    else this.startRegisterAnimation();
  }

  private async startLoginAnimation() {
    this.isTyping = false;
    this.isDeletingEmail = false;
    this.animatedNamePlaceholder = '';
    this.animatedPlaceholder = '';

    while (this.mode() === 'login') {
      const token = this.bumpEmailToken();

      const email = this.loginCharacters[this.loginCharacterIndex].email;
      await this.typeEmail(email, token);
      if (token !== this.emailToken) break;

      await this.delay(3000);
      if (token !== this.emailToken) break;

      await this.deleteEmailText(email, token);
      if (token !== this.emailToken) break;

      await this.delay(800);
      if (token !== this.emailToken) break;

      this.loginCharacterIndex = (this.loginCharacterIndex + 1) % this.loginCharacters.length;
    }

    this.animatedPlaceholder = '';
  }

  private async startRegisterAnimation() {
    this.isTyping = this.isTypingName = this.isDeletingEmail = this.isDeletingName = false;
    this.registerAnimationRunning = true;

    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';

    this.runRegisterAnimationLoop();
  }

  private restartAnimationForMode() {
    this.bumpEmailToken();
    this.bumpNameToken();

    this.registerAnimationRunning = false;
    this.isTyping = this.isTypingName = this.isDeletingEmail = this.isDeletingName = false;

    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;

    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';

    setTimeout(() => this.startAnimationForCurrentMode(), 60);
  }

  private async runRegisterAnimationLoop() {
    while (this.registerAnimationRunning && this.mode() === 'register') {
      const nameToken = this.bumpNameToken();
      const emailToken = this.bumpEmailToken();

      const character = this.registerCharacters[this.registerCharacterIndex];

      await this.typeName(character.name, nameToken);
      if (nameToken !== this.nameToken) break;

      await this.delay(1000);
      if (emailToken !== this.emailToken) break;

      await this.typeEmail(character.email, emailToken);
      if (emailToken !== this.emailToken) break;

      await this.delay(3000);
      if (emailToken !== this.emailToken) break;

      await this.deleteEmailText(character.email, emailToken);
      if (emailToken !== this.emailToken) break;

      await this.delay(500);
      if (nameToken !== this.nameToken) break;

      await this.deleteNameText(character.name, nameToken);
      if (nameToken !== this.nameToken) break;

      await this.delay(500);
      if (nameToken !== this.nameToken || emailToken !== this.emailToken) break;

      this.animatedPlaceholder = '';
      this.animatedNamePlaceholder = '';
      await this.delay(1200);
      if (nameToken !== this.nameToken || emailToken !== this.emailToken) break;

      this.registerCharacterIndex = (this.registerCharacterIndex + 1) % this.registerCharacters.length;
    }

    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';
  }

  // ===== Lógica de tipeo/borrado (con tokens y snapshots) =====
  private async typeEmail(text: string, token: number) {
    if (this.isTyping) return;
    this.isTyping = true;

    for (let i = 0; i <= text.length; i++) {
      if (token !== this.emailToken) break;
      this.animatedPlaceholder = text.substring(0, i);

      let speed = 120;
      if (i < text.length * 0.3) speed = 150;
      else if (i > text.length * 0.7) speed = 80;
      if (text[i] === '@' || text[i] === '.') speed = 200;

      await this.delay(speed);
    }

    if (token === this.emailToken) this.isTyping = false;
  }

  private async deleteEmailText(text: string, token: number) {
    if (this.isDeletingEmail) return;
    this.isDeletingEmail = true;

    const starting = this.animatedPlaceholder || text;

    for (let i = starting.length; i >= 0; i--) {
      if (token !== this.emailToken) break;
      this.animatedPlaceholder = starting.substring(0, i);
      await this.delay(60);
    }

    if (token === this.emailToken) this.isDeletingEmail = false;
  }

  private async typeName(text: string, token: number) {
    if (this.isTypingName) return;
    this.isTypingName = true;

    for (let i = 0; i <= text.length; i++) {
      if (token !== this.nameToken) break;
      this.animatedNamePlaceholder = text.substring(0, i);

      let speed = 120;
      if (i < text.length * 0.3) speed = 150;
      else if (i > text.length * 0.7) speed = 80;
      if (text[i] === ' ') speed = 200;
      else if (text[i] === '-' || text[i] === "'") speed = 180;

      await this.delay(speed);
    }

    if (token === this.nameToken) this.isTypingName = false;
  }

  private async deleteNameText(text: string, token: number) {
    if (this.isDeletingName) return;
    this.isDeletingName = true;

    const starting = this.animatedNamePlaceholder || text;

    for (let i = starting.length; i >= 0; i--) {
      if (token !== this.nameToken) break;
      this.animatedNamePlaceholder = starting.substring(0, i);
      await this.delay(60);
    }

    if (token === this.nameToken) this.isDeletingName = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Focus handlers ---
  onEmailFocus() { this.userIsTyping = true; }
  onEmailBlur() { setTimeout(() => { this.userIsTyping = false; }, 1000); }
  onNameFocus() { this.userIsTypingName = true; }
  onNameBlur() { setTimeout(() => { this.userIsTypingName = false; }, 1000); }

  // ===== Login/Register (actualizados con el nuevo servicio) =====

  async submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorLogin = 'Por favor, completa todos los campos correctamente';
      return;
    }

    // Limpiar estados previos
    this.errorLogin = null;
    this.needsEmailVerification.set(false);
    this.emailSent.set(false);
    this.loadingLogin = true;

    try {
      const { email, password } = this.loginForm.getRawValue();
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      await firstValueFrom(this.auth.login({ email, password }));

      // Login exitoso: ocultar panel con animación
      this.hiding = true;
      setTimeout(() => {
        this.showAuthPanel = false;
        this.hiding = false;
        this.router.navigateByUrl('/');
      }, 180);

    } catch (error: any) {
      console.error('[Home] Login error:', error);

      // ✅ Detectar error de verificación de email usando el servicio
      if (this.emailVerificationService.isEmailVerificationError(error)) {
        this.needsEmailVerification.set(true);
        this.errorLogin = 'Debes verificar tu email antes de iniciar sesión.';
      }
      // Otros errores comunes
      else if (error?.status === 401) {
        this.errorLogin = 'Email o contraseña incorrectos';
      }
      else if (error?.status === 404) {
        this.errorLogin = 'Usuario no encontrado';
      }
      else {
        this.errorLogin = error?.message || 'Error al iniciar sesión';
      }
    } finally {
      this.loadingLogin = false;
    }
  }

  // Método mejorado para reenviar verificación desde home
  async resendVerificationEmailFromHome() {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.errorLogin = 'Por favor ingresa tu email';
      return;
    }

    this.resendingEmail.set(true);
    this.errorLogin = null;
    this.emailSent.set(false);

    try {
      const response = await firstValueFrom(
        this.emailVerificationService.resendForUnverified(email)
      );

      if (response.success) {
        this.emailSent.set(true);
        this.errorLogin = null;
        // Opcional: Mostrar mensaje de éxito
        console.log('[Home] Email de verificación enviado correctamente');
      } else {
        this.errorLogin = response.message || 'No se pudo enviar el email.';
      }
    } catch (err: any) {
      console.error('[Home] Resend error:', err);

      // Usar los helpers del servicio para detectar errores específicos
      if (this.emailVerificationService.isCooldownError(err)) {
        this.errorLogin = 'Por favor espera 2 minutos antes de reenviar el email.';
      }
      else if (this.emailVerificationService.isAlreadyVerifiedError(err)) {
        this.errorLogin = 'Tu email ya está verificado. Intenta iniciar sesión.';
        this.needsEmailVerification.set(false);
      }
      else if (err.status === 404) {
        this.errorLogin = 'Usuario no encontrado con este email.';
      }
      else {
        this.errorLogin = err.message || 'Error al enviar el email de verificación.';
      }
    } finally {
      this.resendingEmail.set(false);
    }
  }

  async submitRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      // Mostrar error específico según el problema
      const passwordControl = this.registerForm.get('password');
      if (passwordControl?.hasError('pattern')) {
        this.errorRegister = 'La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)';
      } else {
        this.errorRegister = 'Por favor, completa todos los campos correctamente';
      }
      return;
    }

    this.errorRegister = null;
    this.loadingRegister = true;

    try {
      const { username, email, password } = this.registerForm.getRawValue();
      if (!username || !email || !password) {
        throw new Error('Todos los campos son requeridos');
      }

      // ← Registrar con el nuevo servicio
      await firstValueFrom(this.auth.register({ username, email, password }));

      // Auto-login después del registro
      await firstValueFrom(this.auth.login({ email, password }));

      // Ocultar panel con animación
      this.hiding = true;
      setTimeout(() => {
        this.showAuthPanel = false;
        this.hiding = false;
        // Navegar a home
        this.router.navigateByUrl('/');
      }, 180);

    } catch (e: any) {
      console.error('[Home] Register error:', e);
      this.errorRegister = e?.message || 'Error al registrarse';
    } finally {
      this.loadingRegister = false;
    }
  }

  goStore() {
    this.router.navigateByUrl('/tienda');
  }
}
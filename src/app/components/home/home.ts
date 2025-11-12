/**
 * Componente de página principal
 *
 * Maneja login/registro y el flujo de verificación de email (banner + reenvío),
 * respetando la estética existente. Incluye animaciones de placeholders y
 * soporte para las tarjetas de introducción (introItems + flip con teclado).
 */
import { Component, computed, effect, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { EmailVerificationService } from '../../features/inbox/services/email.verification';
import { EmailVerificationSyncService } from '../../services/email-verification-sync.service';
import { AuthTransitionService } from '../../services/ui/auth-transition';
import { AuthService } from '../../services/auth/auth';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type IntroItem = { titleKey: string; detailKey: string };

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
  private syncService = inject(EmailVerificationSyncService);
  private transition = inject(AuthTransitionService);
  private translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  user = computed(() => this.auth.user());

  // --- Estado verificación email ---
  needsEmailVerification = signal(false);
  resendingEmail = signal(false);
  emailSent = signal(false);
  actualEmail = signal<string | null>(null); // Email real cuando se loguea con username
  waitingForVerification = signal(false);

  // Estado del botón de reenvío
  resendCooldown = signal(0); // Segundos restantes para poder reenviar
  canResend = signal(false); // Si puede reenviar el email

  // Cleanup functions para polling
  private stopPolling?: () => void;
  private removeStorageListener?: () => void;
  private cooldownInterval?: any;

  // --- Auth panel / animaciones de entrada/salida ---
  showAuthPanel = true;
  entering = false;
  hiding = false;

  // --- Modo actual: login | register ---
  mode = signal<'login' | 'register'>('login');
  setMode(m: 'login' | 'register') {
    if (this.mode() === m) return;
    this.mode.set(m);
    this.restartAnimationForMode();
  }

  // --- Logo fallback ---
  logoOk = true;
  onLogoError() { this.logoOk = false; }

  // --- Formularios ---
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.minLength(3)]], // Acepta email o username
    password: ['', [Validators.required]],
  });

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    ]],
  });

  loadingLogin = false;
  loadingRegister = false;
  errorLogin: string | null = null;
  errorRegister: string | null = null;

  // Mostrar/ocultar contraseña
  showLoginPwd = false;
  showRegisterPwd = false;

  // Mostrar requisitos de contraseña
  showRegisterPasswordRequirements = false;

  // Transición de login (velo con blur)
  authTransitioning = false;
  authPhase: 'loading' | 'success' = 'loading';
  private authTimers: any[] = [];

  // --- Animación de éxito de login ---
  authSuccess = false;
  private authSuccessTimer?: any;

  // --- Placeholders animados (separados por modo) ---
  animatedEmailLogin = '';        // email (login)
  animatedPasswordLogin = '';     // password (login)
  animatedNameRegister = '';      // username (register)
  animatedEmailRegister = '';     // email (register)
  animatedPasswordRegister = '';  // password (register)

  // --- Tokens para cancelar bucles de animación (separados por modo) ---
  private emailLoginToken = 0;
  private passwordLoginToken = 0;
  private nameRegisterToken = 0;
  private emailRegisterToken = 0;
  private passwordRegisterToken = 0;

  private bumpEmailLoginToken(): number { return ++this.emailLoginToken; }
  private bumpPasswordLoginToken(): number { return ++this.passwordLoginToken; }
  private bumpNameRegisterToken(): number { return ++this.nameRegisterToken; }
  private bumpEmailRegisterToken(): number { return ++this.emailRegisterToken; }
  private bumpPasswordRegisterToken(): number { return ++this.passwordRegisterToken; }

  // --- Datos para animación (placeholders de ejemplo) ---
  private loginCharacters = [
    { name: 'Anakin Skywalker', email: 'anakinskywalker@theforce.com' },
    { name: 'Luke Skywalker', email: 'lukeskywalker@jedi.com' },
    { name: 'Leia Organa', email: 'leia@rebellion.com' },
    { name: 'Obi-Wan Kenobi', email: 'obiwan@jedi.com' },
    { name: 'Yoda', email: 'yoda@dagobah.com' },
    { name: 'Darth Vader', email: 'darthvader@empire.com' },
    { name: 'Han Solo', email: 'hansolo@falcon.com' },
    { name: 'Chewbacca', email: 'chewie@kashyyyk.com' },
  ];
  private registerCharacters = [
    { name: 'Frodo Baggins', email: 'frodo@shire.com' },
    { name: 'Gandalf The Grey', email: 'gandalf@istari.com' },
    { name: 'Aragorn', email: 'aragorn@gondor.com' },
    { name: 'Legolas', email: 'legolas@woodland.com' },
    { name: 'Gimli', email: 'gimli@erebor.com' },
    { name: 'Boromir', email: 'boromir@gondor.com' },
  ];
  private loginCharacterIndex = 0;
  private registerCharacterIndex = 0;

  // Contraseñas temáticas para animación
  private loginPasswords = [
    'May_The_Force_2024',
    'UseTheForce123!',
    'DarkSide_Rules',
    'Jedi_Master_77',
    'RebelAlliance!',
    'Imperial_Order',
    'Millennium_Falcon',
    'Wookiee_Power!'
  ];
  private loginPasswordIndex = 0;

  // --- Estados animación (separados por modo) ---
  private isTypingEmailLogin = false;
  private isTypingPasswordLogin = false;
  private isDeletingEmailLogin = false;
  private isDeletingPasswordLogin = false;

  private isTypingNameRegister = false;
  private isTypingEmailRegister = false;
  private isTypingPasswordRegister = false;
  private isDeletingNameRegister = false;
  private isDeletingEmailRegister = false;
  private isDeletingPasswordRegister = false;

  private loginAnimationRunning = false;
  private registerAnimationRunning = false;

  // ==========================
  // Intro cards (diseño original)
  // ==========================
  introItems: IntroItem[] = [
    { titleKey: 'home.intro.cards.1.title', detailKey: 'home.intro.cards.1.detail' },
    { titleKey: 'home.intro.cards.2.title', detailKey: 'home.intro.cards.2.detail' },
    { titleKey: 'home.intro.cards.3.title', detailKey: 'home.intro.cards.3.detail' },
    { titleKey: 'home.intro.cards.4.title', detailKey: 'home.intro.cards.4.detail' },
    { titleKey: 'home.intro.cards.5.title', detailKey: 'home.intro.cards.5.detail' },
    { titleKey: 'home.intro.cards.6.title', detailKey: 'home.intro.cards.6.detail' },
  ];

  // Set con índices de tarjetas "flipped"/expandibles
  flipped = new Set<number>();

  toggleFlip(i: number, ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();
    if (this.flipped.has(i)) this.flipped.delete(i);
    else this.flipped.add(i);
  }

  onCardKey(i: number, ev: KeyboardEvent) {
    // Soporta Enter y Space para accesibilidad
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.toggleFlip(i);
    }
  }
  // ==========================

  // --- Ocultar panel al loguearse con animación ---
  isLoggedIn = computed(() => !!this.user());
  private stopAuthEffect = effect(() => {
    const loggedIn = this.isLoggedIn();
    const mustShow = !loggedIn;
    if (mustShow && !this.showAuthPanel) {
      this.showAuthPanel = true;
      this.entering = true;
      queueMicrotask(() => setTimeout(() => (this.entering = false), 200));
    } else if (!mustShow && this.showAuthPanel) {
      // Durante la transición post-login (global), retenemos el panel
      if (this.transition.transitioning()) return;
      this.hiding = true;
      setTimeout(() => { this.showAuthPanel = false; this.hiding = false; }, 220);
    }
  });

  // --- Detectar verificación de email desde otra pestaña ---
  private verificationEffect = effect(() => {
    const verificationEvent = this.syncService.emailVerified();
    const waiting = this.waitingForVerification();

    console.log('[Home] 🔄 Effect ejecutado');
    console.log('[Home]   - Verification event:', verificationEvent);
    console.log('[Home]   - Waiting for verification:', waiting);

    if (verificationEvent) {
      console.log('[Home] ✅ Email verificado detectado!', verificationEvent);
      console.log('[Home]   - Email:', verificationEvent.email);
      console.log('[Home]   - Timestamp:', verificationEvent.timestamp);

      if (waiting) {
        console.log('[Home] 🚀 Procediendo con auto-login para:', verificationEvent.email);
        this.handleEmailVerifiedFromAnotherTab(verificationEvent.email);
      } else {
        console.log('[Home] ⏸️ No estamos esperando verificación (waiting=false), ignorando evento');
      }
    } else {
      console.log('[Home] ⏳ Aún no hay evento de verificación');
    }
  });

  // ==========================
  // Handlers de focus/blur (animación placeholders)
  // ==========================
  onEmailFocus() {
    // SOLO procesar el focus si estamos en el modo correcto
    const isLogin = this.mode() === 'login';
    if (isLogin) {
      this.bumpEmailLoginToken();
      this.isTypingEmailLogin = false;
      this.isDeletingEmailLogin = false;
      this.animatedEmailLogin = '';
    } else {
      this.bumpEmailRegisterToken();
      this.isTypingEmailRegister = false;
      this.isDeletingEmailRegister = false;
      this.animatedEmailRegister = '';
    }
  }

  onEmailBlur() {
    // SOLO reanudar animación si estamos en el modo correcto Y el campo está vacío
    const isLogin = this.mode() === 'login';

    if (isLogin) {
      const emailLogin = this.loginForm.get('email')?.value || '';
      if (!emailLogin && !this.loginAnimationRunning) {
        setTimeout(() => this.startLoginAnimation(), 100);
      }
    } else {
      const emailRegister = this.registerForm.get('email')?.value || '';
      if (!emailRegister && !this.registerAnimationRunning) {
        setTimeout(() => this.startRegisterAnimation(), 100);
      }
    }
  }

  onNameFocus() {
    // SOLO procesar el focus si estamos en modo registro
    if (this.mode() !== 'register') return;

    this.bumpNameRegisterToken();
    this.isTypingNameRegister = false;
    this.isDeletingNameRegister = false;
    this.animatedNameRegister = '';
  }

  onNameBlur() {
    // SOLO reanudar animación si estamos en modo registro Y el campo está vacío
    if (this.mode() !== 'register') return;

    const nameValue = this.registerForm.get('username')?.value || '';
    if (!nameValue && !this.registerAnimationRunning) {
      setTimeout(() => this.startRegisterAnimation(), 100);
    }
  }

  onPasswordFocus() {
    // SOLO procesar el focus si estamos en el modo correcto
    const isLogin = this.mode() === 'login';
    if (isLogin) {
      this.bumpPasswordLoginToken();
      this.isTypingPasswordLogin = false;
      this.isDeletingPasswordLogin = false;
      this.animatedPasswordLogin = '';
    } else {
      this.bumpPasswordRegisterToken();
      this.isTypingPasswordRegister = false;
      this.isDeletingPasswordRegister = false;
      this.animatedPasswordRegister = '';
    }
  }

  onPasswordBlur() {
    // SOLO reanudar animación si estamos en el modo correcto Y el campo está vacío
    const isLogin = this.mode() === 'login';

    if (isLogin) {
      const passwordValue = this.loginForm.get('password')?.value || '';
      if (!passwordValue && !this.loginAnimationRunning) {
        setTimeout(() => this.startLoginAnimation(), 100);
      }
    } else {
      const passwordValue = this.registerForm.get('password')?.value || '';
      if (!passwordValue && !this.registerAnimationRunning) {
        setTimeout(() => this.startRegisterAnimation(), 100);
      }
    }
  }

  // Handlers específicos para el password del registro (con requisitos)
  onRegisterPasswordFocus() {
    if (this.mode() !== 'register') return;
    this.showRegisterPasswordRequirements = true;
    this.onPasswordFocus(); // Mantener la lógica de animación existente
  }

  onRegisterPasswordBlur() {
    if (this.mode() !== 'register') return;
    this.showRegisterPasswordRequirements = false;
    this.onPasswordBlur(); // Mantener la lógica de animación existente
  }

  // Métodos para validar requisitos de contraseña
  passwordHasMinLength(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return password.length >= 8;
  }

  passwordHasUppercase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[A-Z]/.test(password);
  }

  passwordHasLowercase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[a-z]/.test(password);
  }

  passwordHasNumber(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /\d/.test(password);
  }

  passwordHasSpecial(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[@$!%*?&]/.test(password);
  }
  // ==========================

  ngOnInit() {
    this.startStarWarsAnimation();

    // Escuchar cambios en localStorage como fallback para verificación de email
    this.removeStorageListener = this.syncService.listenToStorageEvents();
  }

  ngOnDestroy() {
    console.log('[Home] 🧹 Limpiando recursos en ngOnDestroy');

    // Invalidar todo lo pendiente
    this.bumpEmailLoginToken();
    this.bumpPasswordLoginToken();
    this.bumpNameRegisterToken();
    this.bumpEmailRegisterToken();
    this.bumpPasswordRegisterToken();

    this.loginAnimationRunning = false;
    this.registerAnimationRunning = false;

    this.isTypingEmailLogin = this.isTypingPasswordLogin = this.isDeletingEmailLogin = this.isDeletingPasswordLogin = false;
    this.isTypingNameRegister = this.isTypingEmailRegister = this.isTypingPasswordRegister = false;
    this.isDeletingNameRegister = this.isDeletingEmailRegister = this.isDeletingPasswordRegister = false;

    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;
    this.loginPasswordIndex = 0;

    // ✅ OPTIMIZACIÓN: Limpiar todos los timers pendientes
    console.log('[Home] Limpiando', this.authTimers.length, 'timers pendientes');
    this.authTimers.forEach(t => clearTimeout(t));
    this.authTimers = [];

    // ✅ Limpiar timer de éxito de auth si existe
    if (this.authSuccessTimer) {
      clearTimeout(this.authSuccessTimer);
      this.authSuccessTimer = undefined;
    }

    // Limpiar recursos de verificación de email
    this.destroy$.next();
    this.destroy$.complete();

    // Limpiar polling si está activo
    if (this.stopPolling) {
      console.log('[Home] Deteniendo polling de verificación');
      this.stopPolling();
      this.stopPolling = undefined;
    }

    // Remover listener de storage
    if (this.removeStorageListener) {
      console.log('[Home] Removiendo listener de storage');
      this.removeStorageListener();
      this.removeStorageListener = undefined;
    }

    // Limpiar el temporizador de cooldown
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    // Limpiar el servicio de sincronización
    this.syncService.reset();

    console.log('[Home] ✅ Recursos limpiados correctamente');
  }

  emailAnimOn(): boolean {
    // Solo activar si estamos en el modo correcto
    const isLogin = this.mode() === 'login';
    if (isLogin) {
      return this.isTypingEmailLogin || this.isDeletingEmailLogin || !!this.animatedEmailLogin;
    } else {
      return this.isTypingEmailRegister || this.isDeletingEmailRegister || !!this.animatedEmailRegister;
    }
  }

  nameAnimOn(): boolean {
    // Solo activar en modo registro
    if (this.mode() !== 'register') return false;
    return this.isTypingNameRegister || this.isDeletingNameRegister || !!this.animatedNameRegister;
  }

  passwordAnimOn(): boolean {
    // Solo activar si estamos en el modo correcto
    const isLogin = this.mode() === 'login';
    if (isLogin) {
      return this.isTypingPasswordLogin || this.isDeletingPasswordLogin || !!this.animatedPasswordLogin;
    } else {
      return this.isTypingPasswordRegister || this.isDeletingPasswordRegister || !!this.animatedPasswordRegister;
    }
  }

  // Getters para los placeholders animados - FORZAR cadena vacía si no es el modo correcto
  get animatedPlaceholder(): string {
    const isLogin = this.mode() === 'login';
    if (isLogin) {
      // En login, solo devolver el placeholder de login (ignorar el de registro)
      return this.animatedEmailLogin;
    } else {
      // En registro, solo devolver el placeholder de registro (ignorar el de login)
      return this.animatedEmailRegister;
    }
  }

  get animatedNamePlaceholder(): string {
    // El nombre solo existe en registro, devolver vacío en login
    if (this.mode() !== 'register') return '';
    return this.animatedNameRegister;
  }

  get animatedPasswordPlaceholder(): string {
    const isLogin = this.mode() === 'login';
    if (isLogin) {
      // En login, solo devolver el placeholder de login (ignorar el de registro)
      return this.animatedPasswordLogin;
    } else {
      // En registro, solo devolver el placeholder de registro (ignorar el de login)
      return this.animatedPasswordRegister;
    }
  }

  // ===== Inicio / reinicio animación =====
  private startStarWarsAnimation() {
    // Invalidar tokens para cancelar cualquier animación en curso
    this.bumpEmailLoginToken();
    this.bumpPasswordLoginToken();
    this.bumpNameRegisterToken();
    this.bumpEmailRegisterToken();
    this.bumpPasswordRegisterToken();

    // Resetear todos los estados de animación
    this.isTypingEmailLogin = this.isTypingPasswordLogin = this.isDeletingEmailLogin = this.isDeletingPasswordLogin = false;
    this.isTypingNameRegister = this.isTypingEmailRegister = this.isTypingPasswordRegister = false;
    this.isDeletingNameRegister = this.isDeletingEmailRegister = this.isDeletingPasswordRegister = false;
    this.loginAnimationRunning = false;
    this.registerAnimationRunning = false;

    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;

    // Limpiar placeholders
    this.animatedEmailLogin = '';
    this.animatedPasswordLogin = '';
    this.animatedNameRegister = '';
    this.animatedEmailRegister = '';
    this.animatedPasswordRegister = '';

    // Iniciar solo la animación del modo actual
    this.startAnimationForCurrentMode();
  }

  private startAnimationForCurrentMode() {
    // Iniciar solo la animación del modo actual
    // Las animaciones previas ya fueron detenidas por startStarWarsAnimation o restartAnimationForMode
    if (this.mode() === 'login') {
      this.startLoginAnimation();
    } else {
      this.startRegisterAnimation();
    }
  }

  private async startLoginAnimation() {
    // SOLO iniciar si estamos en modo login
    if (this.mode() !== 'login') return;

    // Si ya está corriendo, no iniciar otra vez
    if (this.loginAnimationRunning) return;

    this.loginAnimationRunning = true;

    // Asegurar que los placeholders de registro estén vacíos
    this.animatedNameRegister = '';
    this.animatedEmailRegister = '';
    this.animatedPasswordRegister = '';

    while (this.loginAnimationRunning && this.mode() === 'login') {
      // Tokens únicos para el ciclo completo
      const emailToken = this.bumpEmailLoginToken();
      const passwordToken = this.bumpPasswordLoginToken();

      const email = this.loginCharacters[this.loginCharacterIndex].email;
      const password = this.loginPasswords[this.loginPasswordIndex];

      // 1. Animar entrada de email
      await this.typeEmailLogin(email, emailToken);
      if (emailToken !== this.emailLoginToken || !this.loginAnimationRunning || this.mode() !== 'login') break;

      // 2. Animar entrada de password
      await this.typePasswordLogin(password, passwordToken);
      if (passwordToken !== this.passwordLoginToken || !this.loginAnimationRunning || this.mode() !== 'login') break;

      // 3. Pausa de 3 segundos con todo completo
      await this.delay(3000);
      if (emailToken !== this.emailLoginToken || passwordToken !== this.passwordLoginToken || !this.loginAnimationRunning || this.mode() !== 'login') break;

      // 4. Animar salida de password (primero)
      await this.deletePasswordLogin(password, passwordToken);
      if (passwordToken !== this.passwordLoginToken || !this.loginAnimationRunning || this.mode() !== 'login') break;

      // 5. Animar salida de email (después)
      await this.deleteEmailLogin(email, emailToken);
      if (emailToken !== this.emailLoginToken || !this.loginAnimationRunning || this.mode() !== 'login') break;

      // Descanso breve sin texto
      await this.delay(800);
      if (emailToken !== this.emailLoginToken || passwordToken !== this.passwordLoginToken || !this.loginAnimationRunning || this.mode() !== 'login') break;

      this.loginCharacterIndex = (this.loginCharacterIndex + 1) % this.loginCharacters.length;
      this.loginPasswordIndex = (this.loginPasswordIndex + 1) % this.loginPasswords.length;
    }

    // Limpiar al salir
    this.animatedEmailLogin = '';
    this.animatedPasswordLogin = '';
    this.loginAnimationRunning = false;
  }


  private async startRegisterAnimation() {
    // SOLO iniciar si estamos en modo registro
    if (this.mode() !== 'register') return;

    // Si ya está corriendo, no iniciar otra vez
    if (this.registerAnimationRunning) return;

    this.registerAnimationRunning = true;
    this.runRegisterAnimationLoop();
  }

  private restartAnimationForMode() {
    // Invalidar todo lo que esté en curso
    this.bumpEmailLoginToken();
    this.bumpPasswordLoginToken();
    this.bumpNameRegisterToken();
    this.bumpEmailRegisterToken();
    this.bumpPasswordRegisterToken();

    // Detener ambas animaciones
    this.loginAnimationRunning = false;
    this.registerAnimationRunning = false;

    this.isTypingEmailLogin = this.isTypingPasswordLogin = this.isDeletingEmailLogin = this.isDeletingPasswordLogin = false;
    this.isTypingNameRegister = this.isTypingEmailRegister = this.isTypingPasswordRegister = false;
    this.isDeletingNameRegister = this.isDeletingEmailRegister = this.isDeletingPasswordRegister = false;

    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;

    // LIMPIAR TODOS los placeholders inmediatamente
    this.animatedEmailLogin = '';
    this.animatedPasswordLogin = '';
    this.animatedNameRegister = '';
    this.animatedEmailRegister = '';
    this.animatedPasswordRegister = '';

    // Iniciar solo la animación del modo actual después de un breve delay
    setTimeout(() => this.startAnimationForCurrentMode(), 50);
  }

  private async runRegisterAnimationLoop() {
    // Asegurar que los placeholders de login estén vacíos
    this.animatedEmailLogin = '';
    this.animatedPasswordLogin = '';

    while (this.registerAnimationRunning && this.mode() === 'register') {
      // Tokens únicos para el ciclo completo
      const nameToken = this.bumpNameRegisterToken();
      const emailToken = this.bumpEmailRegisterToken();
      const passwordToken = this.bumpPasswordRegisterToken();

      const character = this.registerCharacters[this.registerCharacterIndex];
      const password = this.loginPasswords[this.loginPasswordIndex];

      // 1. Animar entrada de username
      await this.typeNameRegister(character.name, nameToken);
      if (nameToken !== this.nameRegisterToken || !this.registerAnimationRunning || this.mode() !== 'register') break;

      // 2. Animar entrada de email
      await this.typeEmailRegister(character.email, emailToken);
      if (emailToken !== this.emailRegisterToken || !this.registerAnimationRunning || this.mode() !== 'register') break;

      // 3. Animar entrada de password
      await this.typePasswordRegister(password, passwordToken);
      if (passwordToken !== this.passwordRegisterToken || !this.registerAnimationRunning || this.mode() !== 'register') break;

      // 4. Pausa de 3 segundos con todo completo
      await this.delay(3000);
      if (nameToken !== this.nameRegisterToken || emailToken !== this.emailRegisterToken || passwordToken !== this.passwordRegisterToken || !this.registerAnimationRunning || this.mode() !== 'register') break;

      // 5. Animar salida de password (primero)
      await this.deletePasswordRegister(password, passwordToken);
      if (passwordToken !== this.passwordRegisterToken || !this.registerAnimationRunning || this.mode() !== 'register') break;

      // 6. Animar salida de email (después)
      await this.deleteEmailRegister(character.email, emailToken);
      if (emailToken !== this.emailRegisterToken || !this.registerAnimationRunning || this.mode() !== 'register') break;

      // 7. Animar salida de username (último)
      await this.deleteNameRegister(character.name, nameToken);
      if (nameToken !== this.nameRegisterToken || !this.registerAnimationRunning || this.mode() !== 'register') break;

      // Descanso breve sin texto
      await this.delay(800);
      if (nameToken !== this.nameRegisterToken || emailToken !== this.emailRegisterToken || passwordToken !== this.passwordRegisterToken || !this.registerAnimationRunning || this.mode() !== 'register') break;

      this.registerCharacterIndex = (this.registerCharacterIndex + 1) % this.registerCharacters.length;
      this.loginPasswordIndex = (this.loginPasswordIndex + 1) % this.loginPasswords.length;
    }

    // Limpiar al salir
    this.animatedNameRegister = '';
    this.animatedEmailRegister = '';
    this.animatedPasswordRegister = '';
    this.registerAnimationRunning = false;
  }

  // ===== Lógica de tipeo/borrado LOGIN =====
  private async typeEmailLogin(text: string, token: number) {
    if (this.isTypingEmailLogin) return;
    this.isTypingEmailLogin = true;

    for (let i = 0; i <= text.length; i++) {
      if (token !== this.emailLoginToken || this.mode() !== 'login') break;
      this.animatedEmailLogin = text.substring(0, i);
      // Asegurar que el registro esté vacío
      this.animatedEmailRegister = '';

      let speed = 120;
      if (i < text.length * 0.3) speed = 150;
      else if (i > text.length * 0.7) speed = 80;
      if (text[i] === '@' || text[i] === '.') speed = 200;

      await this.delay(speed);
    }

    if (token === this.emailLoginToken) this.isTypingEmailLogin = false;
  }

  private async deleteEmailLogin(text: string, token: number) {
    if (this.isDeletingEmailLogin) return;
    this.isDeletingEmailLogin = true;

    const starting = this.animatedEmailLogin || text;

    for (let i = starting.length; i >= 0; i--) {
      if (token !== this.emailLoginToken) break;
      this.animatedEmailLogin = starting.substring(0, i);
      await this.delay(60);
    }

    if (token === this.emailLoginToken) this.isDeletingEmailLogin = false;
  }

  private async typePasswordLogin(text: string, token: number) {
    if (this.isTypingPasswordLogin) return;
    this.isTypingPasswordLogin = true;

    for (let i = 0; i <= text.length; i++) {
      if (token !== this.passwordLoginToken || this.mode() !== 'login') break;
      this.animatedPasswordLogin = text.substring(0, i);
      // Asegurar que el registro esté vacío
      this.animatedPasswordRegister = '';

      let speed = 100;
      if (i < text.length * 0.3) speed = 130;
      else if (i > text.length * 0.7) speed = 70;
      if (text[i] === '_' || text[i] === '!' || text[i] === '@') speed = 180;

      await this.delay(speed);
    }

    if (token === this.passwordLoginToken) this.isTypingPasswordLogin = false;
  }

  private async deletePasswordLogin(text: string, token: number) {
    if (this.isDeletingPasswordLogin) return;
    this.isDeletingPasswordLogin = true;

    const starting = this.animatedPasswordLogin || text;

    for (let i = starting.length; i >= 0; i--) {
      if (token !== this.passwordLoginToken) break;
      this.animatedPasswordLogin = starting.substring(0, i);
      await this.delay(50);
    }

    if (token === this.passwordLoginToken) this.isDeletingPasswordLogin = false;
  }

  // ===== Lógica de tipeo/borrado REGISTRO =====
  private async typeNameRegister(text: string, token: number) {
    if (this.isTypingNameRegister) return;
    this.isTypingNameRegister = true;

    for (let i = 0; i <= text.length; i++) {
      if (token !== this.nameRegisterToken || this.mode() !== 'register') break;
      this.animatedNameRegister = text.substring(0, i);
      // Asegurar que el login esté vacío
      this.animatedEmailLogin = '';
      this.animatedPasswordLogin = '';

      let speed = 120;
      if (i < text.length * 0.3) speed = 150;
      else if (i > text.length * 0.7) speed = 80;
      if (text[i] === ' ') speed = 200;
      else if (text[i] === '-' || text[i] === "'") speed = 180;

      await this.delay(speed);
    }

    if (token === this.nameRegisterToken) this.isTypingNameRegister = false;
  }

  private async deleteNameRegister(text: string, token: number) {
    if (this.isDeletingNameRegister) return;
    this.isDeletingNameRegister = true;

    const starting = this.animatedNameRegister || text;

    for (let i = starting.length; i >= 0; i--) {
      if (token !== this.nameRegisterToken) break;
      this.animatedNameRegister = starting.substring(0, i);
      await this.delay(60);
    }

    if (token === this.nameRegisterToken) this.isDeletingNameRegister = false;
  }

  private async typeEmailRegister(text: string, token: number) {
    if (this.isTypingEmailRegister) return;
    this.isTypingEmailRegister = true;

    for (let i = 0; i <= text.length; i++) {
      if (token !== this.emailRegisterToken || this.mode() !== 'register') break;
      this.animatedEmailRegister = text.substring(0, i);
      // Asegurar que el login esté vacío
      this.animatedEmailLogin = '';

      let speed = 120;
      if (i < text.length * 0.3) speed = 150;
      else if (i > text.length * 0.7) speed = 80;
      if (text[i] === '@' || text[i] === '.') speed = 200;

      await this.delay(speed);
    }

    if (token === this.emailRegisterToken) this.isTypingEmailRegister = false;
  }

  private async deleteEmailRegister(text: string, token: number) {
    if (this.isDeletingEmailRegister) return;
    this.isDeletingEmailRegister = true;

    const starting = this.animatedEmailRegister || text;

    for (let i = starting.length; i >= 0; i--) {
      if (token !== this.emailRegisterToken) break;
      this.animatedEmailRegister = starting.substring(0, i);
      await this.delay(60);
    }

    if (token === this.emailRegisterToken) this.isDeletingEmailRegister = false;
  }

  private async typePasswordRegister(text: string, token: number) {
    if (this.isTypingPasswordRegister) return;
    this.isTypingPasswordRegister = true;

    for (let i = 0; i <= text.length; i++) {
      if (token !== this.passwordRegisterToken || this.mode() !== 'register') break;
      this.animatedPasswordRegister = text.substring(0, i);
      // Asegurar que el login esté vacío
      this.animatedPasswordLogin = '';

      let speed = 100;
      if (i < text.length * 0.3) speed = 130;
      else if (i > text.length * 0.7) speed = 70;
      if (text[i] === '_' || text[i] === '!' || text[i] === '@') speed = 180;

      await this.delay(speed);
    }

    if (token === this.passwordRegisterToken) this.isTypingPasswordRegister = false;
  }

  private async deletePasswordRegister(text: string, token: number) {
    if (this.isDeletingPasswordRegister) return;
    this.isDeletingPasswordRegister = true;

    const starting = this.animatedPasswordRegister || text;

    for (let i = starting.length; i >= 0; i--) {
      if (token !== this.passwordRegisterToken) break;
      this.animatedPasswordRegister = starting.substring(0, i);
      await this.delay(50);
    }

    if (token === this.passwordRegisterToken) this.isDeletingPasswordRegister = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================
  // Acciones auth
  // ==========================
  async submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      // Validación específica de campos
      const emailControl = this.loginForm.get('email');
      const passwordControl = this.loginForm.get('password');

      if (!emailControl?.value || !passwordControl?.value) {
        this.errorLogin = this.translate.instant('auth.errors.complete_fields');
      } else if (emailControl.hasError('required') || emailControl.hasError('minLength')) {
        this.errorLogin = this.translate.instant('auth.errors.email_or_username_invalid');
      } else if (passwordControl.hasError('required')) {
        this.errorLogin = this.translate.instant('auth.errors.complete_fields');
      } else {
        this.errorLogin = this.translate.instant('auth.errors.complete_fields');
      }
      return;
    }

    this.errorLogin = null;
    this.needsEmailVerification.set(false);
    this.emailSent.set(false);
    this.actualEmail.set(null);
    this.loadingLogin = true;

    // Extract email and password before try block so they're accessible in catch
    const { email, password } = this.loginForm.getRawValue()!;

    try {
      // ✅ Guardar credenciales ANTES del login (para auto-login post-verificación)
      localStorage.setItem('pendingAuth', JSON.stringify({ email, password }));
      
      await firstValueFrom(this.auth.login({ email: email!, password: password! }));

      // ✅ Login exitoso - limpiar pendingAuth y cerrar panel
      localStorage.removeItem('pendingAuth');
      console.log('[Home] Login exitoso, cerrando panel auth');

      // Transición con velo y blur antes de mostrar el home
      this.authTransitioning = true;
      this.authPhase = 'loading';
      this.transition.start('login');
      this.authTimers.forEach(t => clearTimeout(t));
      this.authTimers = [];

      const __t1 = setTimeout(() => { this.authPhase = 'success'; this.transition.setSuccess(); }, 1400);
      const __t2 = setTimeout(() => {
        this.authTransitioning = false;
        this.transition.finish();
        if (this.showAuthPanel) {
          this.hiding = true;
          setTimeout(() => { this.showAuthPanel = false; this.hiding = false; }, 240);
        }
      }, 2400);
      this.authTimers.push(__t1, __t2);

    } catch (error: any) {
      // ✅ Detectar error de verificación
      if (this.emailVerificationService.isEmailVerificationError(error)) {
        console.log('[Home] 🔍 Error completo recibido:', error);
        console.log('[Home] 🔍 error.error:', error?.error);
        console.log('[Home] 🔍 error.error.email:', error?.error?.email);
        console.log('[Home] 🔍 error.email (nivel superior):', error?.email);

        this.needsEmailVerification.set(true);
        this.emailSent.set(false);
        this.waitingForVerification.set(true);
        this.errorLogin = null;

        // ✅ Extraer el email real de la respuesta (CRÍTICO cuando se loguea con username)
        // Primero intentar nivel superior (error normalizado), luego error.error (directo del backend)
        let emailToVerify = email!;
        const realEmail = (error as any)?.email || error?.error?.email;

        if (realEmail) {
          console.log('[Home] ✅ Email real extraído del backend:', realEmail);
          this.actualEmail.set(realEmail);
          emailToVerify = realEmail;
        } else {
          console.warn('[Home] ⚠️ Backend NO devolvió el email real. Usando valor ingresado:', emailToVerify);
        }

        // ✅ Guardar credenciales con email real ANTES de iniciar polling
        console.log('[Home] Guardando credenciales para auto-login con email:', emailToVerify);
        localStorage.setItem('pendingAuth', JSON.stringify({
          email: emailToVerify,
          password: password!
        }));

        console.log('[Home] Iniciando polling con email:', emailToVerify);

        // ✅ Iniciar polling para detectar cuando el email sea verificado
        this.stopPolling = this.syncService.startPollingVerification(emailToVerify, 3000);

        // ✅ Iniciar temporizador SIEMPRE al activar waitingForVerification
        this.startResendCooldown();

        // ✅ Enviar automáticamente el email de verificación (como en el registro)
        console.log('[Home] 📧 Intentando enviar automáticamente email de verificación para:', emailToVerify);
        this.emailVerificationService.resendForUnverified(emailToVerify)
          .subscribe({
            next: (response) => {
              console.log('[Home] Respuesta del servidor:', response);
              if (response.success) {
                this.emailSent.set(true);
                console.log('[Home] ✅ Email de verificación enviado automáticamente con éxito');
                this.errorLogin = null;
              } else {
                console.warn('[Home] ⚠️ El servidor respondió pero no fue exitoso:', response.message);
              }
            },
            error: (err: any) => {
              console.error('[Home] ❌ Error completo al enviar email:', err);
              console.error('[Home] Error status:', err.status);
              console.error('[Home] Error message:', err.message);
              console.error('[Home] Error body:', err.error);

              // No mostrar error si ya está verificado o está en cooldown
              if (this.emailVerificationService.isAlreadyVerifiedError(err)) {
                console.log('[Home] Email ya verificado');
                this.errorLogin = this.translate.instant('auth.errors.email_already_verified');
              } else if (this.emailVerificationService.isCooldownError(err)) {
                console.log('[Home] Email enviado recientemente, en cooldown');
                this.emailSent.set(true); // Marcar como enviado para no confundir al usuario
                this.errorLogin = null;
              } else {
                console.error('[Home] Error inesperado al enviar email automáticamente');
                this.errorLogin = this.translate.instant('auth.errors.email_send_failed_use_button');
              }
            }
          });

        // NO limpiar pendingAuth aquí
      } else {
        localStorage.removeItem('pendingAuth');

        // Detectar y traducir errores comunes del backend
        const errorMessage = error?.message || error?.error?.message || '';

        if (errorMessage.toLowerCase().includes('invalid credentials') ||
            errorMessage.toLowerCase().includes('credenciales inválidas')) {
          this.errorLogin = this.translate.instant('auth.errors.login_failed');
        } else if (errorMessage.toLowerCase().includes('user not found') ||
                   errorMessage.toLowerCase().includes('usuario no encontrado')) {
          this.errorLogin = this.translate.instant('auth.errors.user_not_found');
        } else if (error?.status === 401 || error?.status === 403) {
          this.errorLogin = this.translate.instant('auth.errors.login_failed');
        } else {
          this.errorLogin = errorMessage || this.translate.instant('auth.errors.login_failed');
        }
      }
    } finally {
      this.loadingLogin = false;
    }
  }

  async resendVerificationEmailFromHome() {
    console.log('[Home] 🔄 Botón de reenvío clickeado');

    // Intentar obtener el email de múltiples fuentes
    let emailToUse = this.actualEmail(); // Primero el email real (cuando se loguea con username)

    if (!emailToUse) {
      // Si no está en actualEmail, intentar desde pendingAuth en localStorage
      const pendingAuth = localStorage.getItem('pendingAuth');
      if (pendingAuth) {
        try {
          const parsed = JSON.parse(pendingAuth);
          emailToUse = parsed.email;
          console.log('[Home] Email obtenido de pendingAuth:', emailToUse);
        } catch (e) {
          console.error('[Home] Error parseando pendingAuth:', e);
        }
      }
    }

    if (!emailToUse) {
      // Fallback a los formularios
      const isLogin = this.mode() === 'login';
      emailToUse = (isLogin
        ? this.loginForm.get('email')?.value
        : this.registerForm.get('email')?.value) || null;
      console.log('[Home] Email obtenido del formulario:', emailToUse, 'Modo:', this.mode());
    }

    if (!emailToUse) {
      console.error('[Home] ❌ No se pudo obtener el email para reenviar');
      this.errorLogin = this.translate.instant('auth.errors.enter_email');
      this.errorRegister = this.translate.instant('auth.errors.enter_email');
      return;
    }

    console.log('[Home] 📧 Reenviando email a:', emailToUse);
    this.resendingEmail.set(true);
    this.errorLogin = null;
    this.errorRegister = null;
    this.emailSent.set(false);

    try {
      const response = await firstValueFrom(
        this.emailVerificationService.resendForUnverified(emailToUse)
      );

      console.log('[Home] Respuesta del reenvío:', response);
      if (response.success) {
        this.emailSent.set(true);
        this.errorLogin = null;
        this.errorRegister = null;
        console.log('[Home] ✅ Email reenviado exitosamente');
        // Reiniciar temporizador de cooldown
        this.startResendCooldown();
      } else {
        console.warn('[Home] ⚠️ Reenvío no exitoso:', response.message);
        this.errorLogin = response.message || this.translate.instant('auth.errors.email_send_failed');
        this.errorRegister = response.message || this.translate.instant('auth.errors.email_send_failed');
      }
    } catch (err: any) {
      console.error('[Home] ❌ Error al reenviar:', err);

      if (this.emailVerificationService.isCooldownError(err)) {
        const cooldownMsg = this.translate.instant('auth.errors.cooldown');
        this.errorLogin = cooldownMsg;
        this.errorRegister = cooldownMsg;
      } else if (this.emailVerificationService.isAlreadyVerifiedError(err)) {
        const verifiedMsg = this.translate.instant('auth.errors.already_verified');
        this.errorLogin = verifiedMsg;
        this.errorRegister = verifiedMsg;
        this.needsEmailVerification.set(false);
        this.actualEmail.set(null);
      } else if (err.status === 404) {
        const notFoundMsg = this.translate.instant('auth.errors.user_not_found');
        this.errorLogin = notFoundMsg;
        this.errorRegister = notFoundMsg;
      } else {
        const genericMsg = err.message || this.translate.instant('auth.errors.verification_send_failed');
        this.errorLogin = genericMsg;
        this.errorRegister = genericMsg;
      }
    } finally {
      this.resendingEmail.set(false);
      console.log('[Home] Reenvío completado. resendingEmail.set(false)');
    }
  }

  /**
   * Maneja cuando el email fue verificado desde otra pestaña (auto-login)
   */
  private handleEmailVerifiedFromAnotherTab(email: string): void {
    console.log('[Home] 🎯 Auto-login iniciado. Email verificado:', email);

    // Obtener credenciales de pendingAuth
    const raw = localStorage.getItem('pendingAuth');
    if (!raw) {
      console.warn('[Home] ⚠️ No hay credenciales pendientes para auto-login');
      this.waitingForVerification.set(false);
      return;
    }

    try {
      const { email: savedEmail, password } = JSON.parse(raw);
      console.log('[Home] 📝 Credenciales guardadas. Email:', savedEmail);

      // Verificar que el email coincida (case-insensitive)
      const emailsMatch = savedEmail.toLowerCase().trim() === email.toLowerCase().trim();
      console.log('[Home] 🔍 Comparando emails:');
      console.log('  - Guardado:', savedEmail.toLowerCase().trim());
      console.log('  - Verificado:', email.toLowerCase().trim());
      console.log('  - Coinciden:', emailsMatch);

      if (!emailsMatch) {
        console.error('[Home] ❌ Los emails NO coinciden! No se puede hacer auto-login.');
        this.waitingForVerification.set(false);
        return;
      }

      console.log('[Home] ✅ Emails coinciden. Procediendo con auto-login...');

      // Hacer auto-login
      console.log('[Home] 🔐 Llamando a auth.login con email:', savedEmail);
      this.loadingLogin = true;
      this.loadingRegister = true;
      this.auth.login({ email: savedEmail, password })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            console.log('[Home] 🎉 Auto-login EXITOSO!');
            console.log('[Home]   - Usuario:', user);
            this.waitingForVerification.set(false);
            this.needsEmailVerification.set(false);
            this.loadingLogin = false;
            this.loadingRegister = false;

            // Limpiar credenciales pendientes
            localStorage.removeItem('pendingAuth');

            // Detener polling si está activo
            if (this.stopPolling) {
              this.stopPolling();
              this.stopPolling = undefined;
            }

            // Transición con velo y blur antes de mostrar el home
            this.authTransitioning = true;
            this.authPhase = 'loading';
            this.transition.start('login');
            this.authTimers.forEach(t => clearTimeout(t));
            this.authTimers = [];

            const __t1 = setTimeout(() => {
              this.authPhase = 'success';
              this.transition.setSuccess();
            }, 1400);

            const __t2 = setTimeout(() => {
              this.authTransitioning = false;
              this.transition.finish();
              if (this.showAuthPanel) {
                this.hiding = true;
                setTimeout(() => {
                  this.showAuthPanel = false;
                  this.hiding = false;
                }, 240);
              }
            }, 2400);

            this.authTimers.push(__t1, __t2);
          },
          error: (err) => {
            console.error('[Home] ❌ Error en auto-login:', err);
            console.error('[Home]   - Status:', err?.status);
            console.error('[Home]   - Message:', err?.message);
            console.error('[Home]   - Error body:', err?.error);

            this.loadingLogin = false;
            this.loadingRegister = false;
            this.waitingForVerification.set(false);
            this.errorLogin = this.translate.instant('auth.errors.auto_login_failed');
            this.errorRegister = this.translate.instant('auth.errors.auto_login_failed');
            localStorage.removeItem('pendingAuth');
          }
        });
    } catch (e) {
      console.error('[Home] Error parseando pendingAuth:', e);
      this.waitingForVerification.set(false);
    }
  }

  async submitRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      // Validación específica de campos
      const usernameControl = this.registerForm.get('username');
      const emailControl = this.registerForm.get('email');
      const passwordControl = this.registerForm.get('password');

      if (!usernameControl?.value || !emailControl?.value || !passwordControl?.value) {
        this.errorRegister = this.translate.instant('auth.errors.complete_fields');
      } else if (usernameControl.hasError('required') || usernameControl.hasError('minLength')) {
        this.errorRegister = this.translate.instant('auth.errors.complete_fields');
      } else if (emailControl.hasError('email')) {
        this.errorRegister = this.translate.instant('auth.errors.email_invalid');
      } else if (passwordControl.hasError('minLength')) {
        this.errorRegister = this.translate.instant('auth.errors.password_min_length');
      } else if (passwordControl.hasError('pattern')) {
        this.errorRegister = this.translate.instant('auth.errors.password_requirements');
      } else {
        this.errorRegister = this.translate.instant('auth.errors.complete_fields');
      }
      return;
    }

    this.errorRegister = null;
    this.needsEmailVerification.set(false);
    this.emailSent.set(false);
    this.loadingRegister = true;

    try {
      const { username, email, password } = this.registerForm.getRawValue()!;

      // ✅ Guardar credenciales ANTES del registro (para auto-login post-verificación)
      localStorage.setItem('pendingAuth', JSON.stringify({ email, password }));

      const reg = await firstValueFrom(
        this.auth.register({ username: username!, email: email!, password: password! })
      );

      console.log('[Home] Registro exitoso:', reg);

      // ✅ Siempre mostrar banner de verificación después del registro
      this.needsEmailVerification.set(true);
      this.emailSent.set(true);
      this.waitingForVerification.set(true);
      this.errorRegister = null;

      // ✅ Mensaje informativo
      console.log('[Home] Esperando verificación de email para:', email);

      // ✅ Iniciar polling para detectar cuando el email sea verificado
      this.stopPolling = this.syncService.startPollingVerification(email!, 3000);

      // Iniciar temporizador de 30 segundos para reenvío
      this.startResendCooldown();

    } catch (e: any) {
      console.error('[Home] Register error:', e);

      // ✅ Si falla el registro, limpiar pendingAuth
      localStorage.removeItem('pendingAuth');

      if (this.emailVerificationService.isEmailVerificationError(e)) {
        this.needsEmailVerification.set(true);
        this.emailSent.set(true);
        this.errorRegister = null;
      } else {
        // Detectar y traducir errores comunes del backend
        const errorMessage = e?.message || e?.error?.message || '';

        if (errorMessage.toLowerCase().includes('email already exists') ||
            errorMessage.toLowerCase().includes('email ya existe')) {
          this.errorRegister = this.translate.instant('auth.errors.email_already_exists');
        } else if (errorMessage.toLowerCase().includes('username already exists') ||
                   errorMessage.toLowerCase().includes('usuario ya existe')) {
          this.errorRegister = this.translate.instant('auth.errors.username_already_exists');
        } else if (e?.status === 409) {
          this.errorRegister = this.translate.instant('auth.errors.account_already_exists');
        } else {
          this.errorRegister = errorMessage || this.translate.instant('auth.errors.register_failed');
        }
      }
    } finally {
      this.loadingRegister = false;
    }
  }

  scrollToIntro(): void {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('intro-panel');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  goStore() { this.router.navigateByUrl('/tienda'); }

  /**
   * Inicia el temporizador de 30 segundos para poder reenviar el email
   */
  private startResendCooldown(): void {
    this.resendCooldown.set(30);
    this.canResend.set(false);

    // Limpiar intervalo anterior si existe
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    // Iniciar cuenta regresiva
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current > 0) {
        this.resendCooldown.set(current - 1);
      } else {
        // Cuando llega a 0, habilitar el botón de reenvío
        this.canResend.set(true);
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = undefined;
        }
      }
    }, 1000);
  }
}

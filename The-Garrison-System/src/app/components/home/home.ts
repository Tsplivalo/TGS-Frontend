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
import { firstValueFrom } from 'rxjs';
import { EmailVerificationService } from '../../features/inbox/services/email.verification';
import { AuthService } from '../../services/auth/auth';
import { TranslateModule } from '@ngx-translate/core';

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

  user = computed(() => this.auth.user());

  // --- Estado verificación email ---
  needsEmailVerification = signal(false);
  resendingEmail = signal(false);
  emailSent = signal(false);

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
    email: ['', [Validators.required, Validators.email]],
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

  // --- Placeholders animados ---
  animatedPlaceholder = '';       // email (login/register)
  animatedNamePlaceholder = '';   // username (register)

  // --- Tokens para cancelar bucles de animación ---
  private emailToken = 0;
  private nameToken = 0;
  private bumpEmailToken(): number { return ++this.emailToken; }
  private bumpNameToken(): number { return ++this.nameToken; }

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

  // --- Estados animación ---
  isTyping = false;
  isTypingName = false;
  isDeletingEmail = false;
  isDeletingName = false;
  registerAnimationRunning = false;

  // ==========================
  // Intro cards (lo que faltaba)
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
      this.hiding = true;
      setTimeout(() => { this.showAuthPanel = false; this.hiding = false; }, 220);
    }
  });

  // ==========================
  // Handlers de focus/blur (animación placeholders)
  // ==========================
  onEmailFocus() {
    // Detenemos la animación de email al enfocar (para no chocar con escritura)
    this.bumpEmailToken();
    this.isTyping = false;
    this.isDeletingEmail = false;
    this.animatedPlaceholder = '';
  }

  onEmailBlur() {
    // Si el campo está vacío, reanudar animación acorde al modo
    const isLogin = this.mode() === 'login';
    const emailLogin = this.loginForm.get('email')?.value || '';
    const emailRegister = this.registerForm.get('email')?.value || '';
    const emptyLogin = isLogin && !emailLogin;
    const emptyRegister = !isLogin && !emailRegister;

    if (emptyLogin) {
      const et = this.bumpEmailToken();
      void this.loopLoginEmails(et);
    } else if (emptyRegister) {
      const nt = this.bumpNameToken();
      const et = this.bumpEmailToken();
      void this.loopRegisterNameAndEmail(nt, et);
    }
  }

  onNameFocus() {
    this.bumpNameToken();
    this.isTypingName = false;
    this.isDeletingName = false;
    this.animatedNamePlaceholder = '';
  }

  onNameBlur() {
    const nameValue = this.registerForm.get('username')?.value || '';
    if (!nameValue && this.mode() === 'register') {
      const nt = this.bumpNameToken();
      const et = this.emailToken; // mantener email token actual
      void this.loopRegisterNameAndEmail(nt, et);
    }
  }
  // ==========================

  ngOnInit() { this.startStarWarsAnimation(); }

  ngOnDestroy() {
    this.bumpEmailToken();
    this.bumpNameToken();
    this.registerAnimationRunning = false;
    this.isTyping = this.isTypingName = this.isDeletingEmail = this.isDeletingName = false;
    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;
  }

  emailAnimOn(): boolean {
    return this.isTyping || this.isDeletingEmail || !!this.animatedPlaceholder;
  }
  nameAnimOn(): boolean {
    return this.isTypingName || this.isDeletingName || !!this.animatedNamePlaceholder;
  }

  private startStarWarsAnimation() {
    this.registerAnimationRunning = true;
    this.bumpEmailToken();
    this.bumpNameToken();
    const emailToken = this.emailToken;
    const nameToken = this.nameToken;
    void this.loopLoginEmails(emailToken);
    void this.loopRegisterNameAndEmail(nameToken, emailToken);
  }

  private restartAnimationForMode() {
    this.bumpEmailToken();
    this.bumpNameToken();
    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';
    setTimeout(() => this.startStarWarsAnimation(), 30);
  }

  private async loopLoginEmails(emailToken: number) {
    while (this.registerAnimationRunning && emailToken === this.emailToken) {
      const character = this.loginCharacters[this.loginCharacterIndex];
      await this.typeEmailText(character.email, emailToken);
      if (emailToken !== this.emailToken) break;
      await this.delay(3000);
      if (emailToken !== this.emailToken) break;
      await this.deleteEmailText(character.email, emailToken);
      if (emailToken !== this.emailToken) break;
      await this.delay(500);
      this.loginCharacterIndex = (this.loginCharacterIndex + 1) % this.loginCharacters.length;
    }
  }

  private async loopRegisterNameAndEmail(nameToken: number, emailToken: number) {
    while (this.registerAnimationRunning && nameToken === this.nameToken && emailToken === this.emailToken) {
      const character = this.registerCharacters[this.registerCharacterIndex];
      await this.typeNameText(character.name, nameToken);
      if (nameToken !== this.nameToken) break;
      await this.delay(300);
      if (emailToken !== this.emailToken) break;
      await this.typeEmailText(character.email, emailToken);
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

  private async typeEmailText(text: string, token: number) {
    if (this.isDeletingEmail) await this.delay(100);
    this.isTyping = true;
    for (let i = 1; i <= text.length && token === this.emailToken; i++) {
      this.animatedPlaceholder = text.slice(0, i);
      await this.delay(18 + Math.random() * 25);
    }
    this.isTyping = false;
  }

  private async deleteEmailText(text: string, token: number) {
    this.isDeletingEmail = true;
    for (let i = text.length; i >= 0 && token === this.emailToken; i--) {
      this.animatedPlaceholder = text.slice(0, i);
      await this.delay(10 + Math.random() * 20);
    }
    this.isDeletingEmail = false;
  }

  private async typeNameText(text: string, token: number) {
    if (this.isDeletingName) await this.delay(100);
    this.isTypingName = true;
    for (let i = 1; i <= text.length && token === this.nameToken; i++) {
      this.animatedNamePlaceholder = text.slice(0, i);
      await this.delay(20 + Math.random() * 25);
    }
    this.isTypingName = false;
  }

  private async deleteNameText(text: string, token: number) {
    this.isDeletingName = true;
    for (let i = text.length; i >= 0 && token === this.nameToken; i--) {
      this.animatedNamePlaceholder = text.slice(0, i);
      await this.delay(12 + Math.random() * 18);
    }
    this.isDeletingName = false;
  }

  private delay(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

  // ==========================
  // Acciones auth
  // ==========================
async submitLogin() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    this.errorLogin = 'Por favor, completa todos los campos correctamente';
    return;
  }

  this.errorLogin = null;
  this.needsEmailVerification.set(false);
  this.emailSent.set(false);
  this.loadingLogin = true;

  try {
    const { email, password } = this.loginForm.getRawValue()!;
    
    // ✅ Guardar credenciales ANTES del login (para auto-login post-verificación)
    localStorage.setItem('pendingAuth', JSON.stringify({ email, password }));
    
    await firstValueFrom(this.auth.login({ email: email!, password: password! }));

    // ✅ Login exitoso - limpiar pendingAuth y cerrar panel
    localStorage.removeItem('pendingAuth');
    console.log('[Home] Login exitoso, cerrando panel auth');

  } catch (error: any) {
    // ✅ Detectar error de verificación
    if (this.emailVerificationService.isEmailVerificationError(error)) {
      this.needsEmailVerification.set(true);
      this.emailSent.set(false);
      this.errorLogin = null;
      // NO limpiar pendingAuth aquí
    } else {
      localStorage.removeItem('pendingAuth');
      this.errorLogin = error?.message || 'Error al iniciar sesión';
    }
  }
}

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
    } else {
      this.errorLogin = response.message || 'No se pudo enviar el email.';
    }
  } catch (err: any) {
    console.error('[Home] Resend error:', err);
    
    if (this.emailVerificationService.isCooldownError(err)) {
      this.errorLogin = 'Por favor espera 2 minutos antes de reenviar el email.';
    } else if (this.emailVerificationService.isAlreadyVerifiedError(err)) {
      this.errorLogin = 'Tu email ya está verificado. Intenta iniciar sesión.';
      this.needsEmailVerification.set(false);
    } else if (err.status === 404) {
      this.errorLogin = 'Usuario no encontrado con este email.';
    } else {
      this.errorLogin = err.message || 'Error al enviar el email de verificación.';
    }
  } finally {
    this.resendingEmail.set(false);
  }
}

async submitRegister() {
  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    const pwd = this.registerForm.get('password');
    if (pwd?.hasError('pattern')) {
      this.errorRegister = 'La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)';
    } else {
      this.errorRegister = 'Por favor, completa todos los campos correctamente';
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
    this.errorRegister = null;

    // ✅ Mensaje informativo
    console.log('[Home] Por favor verifica tu email antes de iniciar sesión');

  } catch (e: any) {
    console.error('[Home] Register error:', e);
    
    // ✅ Si falla el registro, limpiar pendingAuth
    localStorage.removeItem('pendingAuth');
    
    if (this.emailVerificationService.isEmailVerificationError(e)) {
      this.needsEmailVerification.set(true);
      this.emailSent.set(true);
      this.errorRegister = null;
    } else {
      this.errorRegister = e?.message || 'Error al registrarse';
    }
  } finally {
    this.loadingRegister = false;
  }
}

  goStore() { this.router.navigateByUrl('/tienda'); }
}

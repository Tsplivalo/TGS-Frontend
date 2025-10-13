import { Component, computed, effect, inject, signal, OnInit, OnDestroy } from '@angular/core';
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
export class HomeComponent implements OnInit, OnDestroy {
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
  setMode(m: 'login' | 'register') { 
    this.mode.set(m); 
    // Reiniciar animaciones cuando cambie el modo
    this.restartAnimationForMode();
  }

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

  // --- Animación Star Wars ---
  animatedPlaceholder = '';
  animatedNamePlaceholder = '';

  // Placeholders genéricos que se muestran cuando no hay animación
  genericEmailPlaceholder = 'tucorreo@ejemplo.com';
  genericNamePlaceholder = 'tunombre';

  // Lista independiente de personajes para modo login (solo emails)
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

  // Lista independiente de personajes para modo registro (nombres + emails)
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
  private animationInterval: any;
  private nameAnimationInterval: any;
  private isTyping = false;
  private isTypingName = false;
  private isDeletingEmail = false;
  private isDeletingName = false;
  private userIsTyping = false;
  private userIsTypingName = false;
  private registerAnimationRunning = false;

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

  // --- Ciclo de vida ---
  ngOnInit() {
    console.log('HomeComponent ngOnInit - Iniciando animación Star Wars');
    this.startStarWarsAnimation();
  }

  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    if (this.nameAnimationInterval) {
      clearInterval(this.nameAnimationInterval);
    }

    // Detener animación de registro si está corriendo
    this.registerAnimationRunning = false;

    // Limpiar flags de estado
    this.isTyping = false;
    this.isTypingName = false;
    this.isDeletingEmail = false;
    this.isDeletingName = false;

    // Resetear índices de personajes
    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;
  }

  // --- Animación Star Wars ---
  private startStarWarsAnimation() {
    console.log('Iniciando animación Star Wars por modo');

    // Limpiar flags
    this.isTyping = false;
    this.isTypingName = false;
    this.isDeletingEmail = false;
    this.isDeletingName = false;
    this.registerAnimationRunning = false;

    // Resetear índices de personajes
    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;

    // Detener cualquier animación previa
    if (this.animationInterval) clearInterval(this.animationInterval);
    if (this.nameAnimationInterval) clearInterval(this.nameAnimationInterval);

    // Reset placeholders
    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';

    // Iniciar según el modo
    this.startAnimationForCurrentMode();
  }

  private startAnimationForCurrentMode() {
    const mode = this.mode();
    console.log(`Iniciando animación para modo: ${mode}`);

    if (mode === 'login') {
      // Solo animar el campo de email
      this.startLoginAnimation();
    } else if (mode === 'register') {
      // Animar nombre + email (no la del login)
      this.startRegisterAnimation();
    }
  }

  private async startLoginAnimation() {
    console.log('💡 Iniciando animación de login (solo email)');

    // Limpiar intervalos previos
    if (this.animationInterval) clearInterval(this.animationInterval);

    // Flags
    this.isTyping = false;
    this.isDeletingEmail = false;

    // Reset placeholders
    this.animatedNamePlaceholder = ''; // No hay nombre en login
    this.animatedPlaceholder = '';

    // Bucle de animación (solo email)
    while (this.mode() === 'login') {
      const character = this.loginCharacters[this.loginCharacterIndex];
      console.log(`✉️ Escribiendo email de: ${character.name}`);

      await this.typeEmail();
      await this.delay(3000); // mostrarlo un rato
      await this.deleteEmailText();

      // Después de borrar, esperar 0.5s y mostrar placeholder genérico si está vacío
      await this.delay(500);
      if (!this.animatedPlaceholder) {
        this.animatedPlaceholder = this.genericEmailPlaceholder;
      }
      await this.delay(500); // completar el segundo de pausa

      this.loginCharacterIndex = (this.loginCharacterIndex + 1) % this.loginCharacters.length;
    }

    console.log('🛑 Animación de login detenida');

    // Si cambia el modo, limpiar placeholder
    this.animatedPlaceholder = '';
  }

  private async startRegisterAnimation() {
    console.log('Iniciando animación de registro (versión sincronizada)');

    // Limpiar intervalos previos si los hubiera
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }
    if (this.nameAnimationInterval) {
      clearInterval(this.nameAnimationInterval);
      this.nameAnimationInterval = undefined;
    }

    // Reset de flags
    this.isTyping = false;
    this.isTypingName = false;
    this.isDeletingEmail = false;
    this.isDeletingName = false;
    this.registerAnimationRunning = true;

    // Limpiar placeholders
    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';

    // Iniciar bucle principal de animación (no bloqueante)
    // No usamos setInterval para evitar solapamientos; usamos un loop asincrónico controlado.
    this.runRegisterAnimationLoop();
  }

  private restartAnimationForMode() {
    console.log(`🔄 Reiniciando animación para modo: ${this.mode()}`);

    // Limpiar intervalos
    if (this.animationInterval) clearInterval(this.animationInterval);
    if (this.nameAnimationInterval) clearInterval(this.nameAnimationInterval);

    // 🔥 FORZAR DETENCIÓN de todas las animaciones
    this.registerAnimationRunning = false;
    this.isTyping = false;
    this.isTypingName = false;
    this.isDeletingEmail = false;
    this.isDeletingName = false;

    // Resetear índices de personajes
    this.loginCharacterIndex = 0;
    this.registerCharacterIndex = 0;

    // Limpiar placeholders inmediatamente
    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';

    // Reiniciar animación según modo actual
    setTimeout(() => {
      this.startAnimationForCurrentMode();
    }, 100); // Reducir delay para respuesta más rápida
  }

  getPlaceholderForMode() {
    if (this.mode() === 'login') {
      return this.animatedPlaceholder || this.genericEmailPlaceholder;
    } else {
      return this.animatedPlaceholder || this.genericEmailPlaceholder;
    }
  }

  getNamePlaceholderForMode() {
    if (this.mode() === 'register') {
      return this.animatedNamePlaceholder || this.genericNamePlaceholder;
    }
    // En modo login, no mostrar ningún placeholder de nombre
    return '';
  }


  private async runRegisterAnimationLoop() {
    // Este bucle se repite mientras el modo sea "register" Y la animación esté activa
    while (this.registerAnimationRunning && this.mode() === 'register') {
      const character = this.registerCharacters[this.registerCharacterIndex];
      console.log(`🎬 Animando personaje: ${character.name} <${character.email}>`);

      // 1) Escribir nombre (queda grabado en animatedNamePlaceholder)
      await this.typeName();
      // pequeña pausa para simular lectura
      await this.delay(1000);

      // 2) Escribir email (animación independiente)
      await this.typeEmailForRegister();
      // dejar visible para lectura
      await this.delay(3000);

      // 3) Borrar sólo el email (el nombre se mantiene)
      await this.deleteEmailText();

      // Después de borrar email, esperar 0.5s y mostrar placeholder si está vacío
      await this.delay(500);
      if (!this.animatedPlaceholder) {
        this.animatedPlaceholder = this.genericEmailPlaceholder;
      }
      await this.delay(500); // completar el segundo de pausa

      // 4) Borrar el nombre
      await this.deleteNameText();

      // Después de borrar nombre, esperar 0.5s y mostrar placeholder si está vacío
      await this.delay(500);
      if (!this.animatedNamePlaceholder) {
        this.animatedNamePlaceholder = this.genericNamePlaceholder;
      }
      await this.delay(500); // completar el segundo de pausa

      // 5) Mostrar placeholders genéricos por 2 segundos adicionales
      this.showGenericPlaceholders();
      await this.delay(2000);

      // 6) Cambiar al siguiente personaje
      this.registerCharacterIndex = (this.registerCharacterIndex + 1) % this.registerCharacters.length;
    }

    console.log('🛑 Animación de registro detenida');
    // Cuando salimos del loop (modo != 'register'), limpiamos placeholders si es necesario
    this.animatedPlaceholder = '';
    this.animatedNamePlaceholder = '';
  }

  private async typeEmail() {
    if (this.isTyping) return;

    this.isTyping = true;
    const character = this.loginCharacters[this.loginCharacterIndex];
    const email = character.email;
    console.log('Escribiendo email (login):', email);

    // Escribir email carácter por carácter
    await this.typeTextWithVariableSpeed(email);

    this.isTyping = false;
  }

  private async deleteEmailText() {
    if (this.isDeletingEmail) return; // Prevenir ejecuciones simultáneas

    this.isDeletingEmail = true;
    const character = this.loginCharacters[this.loginCharacterIndex];
    const email = character.email;
    console.log('Borrando email (login):', email);

    // Borrar email más rápido
    await this.deleteText(email.length, 60);

    this.isDeletingEmail = false;
  }

  private async typeEmailForRegister() {
    if (this.isTyping) return; // Usar la misma flag para evitar conflictos con otras funciones de email

    this.isTyping = true;
    const character = this.registerCharacters[this.registerCharacterIndex];
    const email = character.email;
    console.log('Escribiendo email en registro:', email);

    // Escribir email carácter por carácter (animación independiente)
    await this.typeTextWithVariableSpeed(email);

    this.isTyping = false;
  }

  private showGenericPlaceholders() {
    console.log('Mostrando placeholders genéricos');
    this.animatedPlaceholder = this.genericEmailPlaceholder;
    this.animatedNamePlaceholder = this.genericNamePlaceholder;
  }

  private async typeTextWithVariableSpeed(text: string): Promise<void> {
    for (let i = 0; i <= text.length; i++) {
      this.animatedPlaceholder = text.substring(0, i);
      
      // Velocidad variable: más lento al principio, más rápido al final
      let speed = 120; // velocidad base
      if (i < text.length * 0.3) {
        speed = 150; // más lento al principio
      } else if (i > text.length * 0.7) {
        speed = 80; // más rápido al final
      }
      
      // Pausas especiales en caracteres importantes
      if (text[i] === '@' || text[i] === '.') {
        speed = 200; // pausa más larga en @ y .
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

  // --- Animación de nombres ---
  private async typeName() {
    if (this.isTypingName) return;

    this.isTypingName = true;
    const character = this.registerCharacters[this.registerCharacterIndex];
    const name = character.name;
    console.log('Escribiendo nombre (registro):', name);

    // Escribir nombre carácter por carácter
    await this.typeNameWithVariableSpeed(name);

    this.isTypingName = false;
  }

  private async deleteNameText() {
    if (this.isDeletingName) return; // Prevenir ejecuciones simultáneas

    this.isDeletingName = true;
    const character = this.registerCharacters[this.registerCharacterIndex];
    const name = character.name;
    console.log('Borrando nombre (registro):', name);

    // Usar la misma velocidad de borrado que los emails para consistencia
    await this.deleteNameTextWithSpeed(name.length, 60);

    this.isDeletingName = false;
    // NO cambiar el índice aquí, se hace al final de toda la secuencia
  }

  private async typeNameWithVariableSpeed(text: string): Promise<void> {
    for (let i = 0; i <= text.length; i++) {
      this.animatedNamePlaceholder = text.substring(0, i);
      
      // Usar la misma velocidad variable que los emails para consistencia
      let speed = 120; // velocidad base (igual que emails)
      if (i < text.length * 0.3) {
        speed = 150; // más lento al principio (igual que emails)
      } else if (i > text.length * 0.7) {
        speed = 80; // más rápido al final (igual que emails)
      }
      
      // Pausas especiales en caracteres importantes (igual que emails)
      if (text[i] === ' ') {
        speed = 200; // pausa más larga en espacios
      } else if (text[i] === '-' || text[i] === "'") {
        speed = 180; // pausa en guiones y apostrofes
      }
      
      await this.delay(speed);
    }
  }

  private async deleteNameTextWithSpeed(length: number, speed: number): Promise<void> {
    for (let i = length; i >= 0; i--) {
      this.animatedNamePlaceholder = this.animatedNamePlaceholder.substring(0, i);
      await this.delay(speed);
    }
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

  onNameFocus() {
    this.userIsTypingName = true;
  }

  onNameBlur() {
    // Reanudar animación después de un delay
    setTimeout(() => {
      this.userIsTypingName = false;
    }, 1000);
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

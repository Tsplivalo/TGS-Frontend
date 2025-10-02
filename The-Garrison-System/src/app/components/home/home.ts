import { Component, OnDestroy, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { Subscription, of } from 'rxjs';
import { switchMap, catchError, filter } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly user       = this.auth.user;

  showAuthPanel = true;
  hiding  = false;
  entering = false;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loadingLogin = false;
  loadingRegister = false;
  errorLogin: string | null = null;
  errorRegister: string | null = null;

  mode: 'login' | 'register' = 'login';

  // Logo (desde assets/Sets)
  logoOk = true;
  onLogoError() { this.logoOk = false; }

  qpSub?: Subscription;
  navSub?: Subscription;

  ngOnInit(): void {
    this.showAuthPanel = !this.isLoggedIn();

    this.qpSub = this.route.queryParamMap.subscribe(params => {
      const q = params.get('auth');
      if (q === 'login' || q === 'register') this.setMode(q);
    });

    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const atHome = this.router.url.split('?')[0].replace(/\/+$/, '') === '' || this.router.url === '/';
        if (atHome && !this.isLoggedIn() && !this.showAuthPanel) this.fadeInAuthPanel(true);
      });

    effect(() => {
      const logged = this.isLoggedIn();
      if (logged) this.fadeOutAuthPanel();
      else this.fadeInAuthPanel();
    });
  }

  ngOnDestroy(): void {
    this.qpSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  setMode(m: 'login' | 'register') {
    if (this.mode === m) return;
    this.mode = m;
    this.router.navigate([], { queryParams: { auth: this.mode }, replaceUrl: true });
  }

  private fadeOutAuthPanel() {
    if (!this.showAuthPanel || this.hiding) return;
    this.hiding = true;
    setTimeout(() => { this.showAuthPanel = false; this.hiding = false; }, 300);
  }

  private fadeInAuthPanel(force = false) {
    if (this.showAuthPanel && !force) return;
    this.entering = true;
    this.showAuthPanel = true;
    setTimeout(() => { this.entering = false; }, 30);
  }

  submitLogin() {
    if (this.loadingLogin) return;
    this.loadingLogin = true; this.errorLogin = null;

    const email = this.loginForm.controls.email.value!.trim();
    const password = this.loginForm.controls.password.value!;

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
        this.fadeOutAuthPanel();
      },
      error: (e) => {
        const m = e?.error?.message || e?.error?.mensaje || e?.error?.error ||
                  (Array.isArray(e?.error?.errores) && e.error.errores[0]?.message) || e?.message;
        this.errorLogin = m ? String(m) : 'No se pudo iniciar sesión.';
      }
    }).add(() => this.loadingLogin = false);
  }

  submitRegister() {
    if (this.loadingRegister) return;
    this.loadingRegister = true; this.errorRegister = null;

    const username = this.registerForm.controls.username.value!.trim();
    const email    = this.registerForm.controls.email.value!.trim();
    const password = this.registerForm.controls.password.value!;

    this.auth.register({ username, email, password }).pipe(
      switchMap(() => this.auth.login({ email, password })), // auto-login tras registro
      catchError(err => {
        const m = err?.error?.message || err?.error?.mensaje || err?.error?.error ||
                  (Array.isArray(err?.error?.errores) && err.error.errores[0]?.message) || err?.message;
        this.errorRegister = m ? String(m) : null;
        this.setMode('login');
        this.loginForm.patchValue({ email });
        return of(null);
      })
    ).subscribe({
      next: (u) => {
        if (u) {
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
          this.fadeOutAuthPanel();
        }
      }
    }).add(() => this.loadingRegister = false);
  }
}

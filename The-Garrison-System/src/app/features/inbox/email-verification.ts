import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { EmailVerificationService } from '../../services/email-verification/email.verification';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <section class="max-w-lg mx-auto p-4">
    <h1 class="text-2xl font-semibold mb-3">Verificación de email</h1>

    <div *ngIf="state() === 'idle'" class="box">Pegá el link de verificación que recibiste por correo o hacé clic en el botón del email.</div>

    <div *ngIf="state() === 'verifying'" class="box">Verificando token...</div>

    <div *ngIf="state() === 'ok'" class="box ok">¡Tu email fue verificado correctamente!</div>

    <div *ngIf="state() === 'error'" class="box bad">No se pudo verificar el token. {{ message() }}</div>

    <div class="mt-4 flex gap-2">
      <button class="btn" (click)="resend()">Reenviar verificación</button>
      <a routerLink="/" class="btn">Ir al inicio</a>
    </div>
  </section>
  `,
  styles: [`
    .box{ border:1px solid #e5e7eb; background:#fff; border-radius:.75rem; padding:1rem }
    .ok{ background:#ecfdf5; border-color:#10b981 }
    .bad{ background:#fef2f2; border-color:#ef4444 }
    .btn{border:1px solid #ddd;padding:.45rem .8rem;border-radius:.5rem;background:#fff}
  `]
})
export class EmailVerificationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(EmailVerificationService);

  state = signal<'idle'|'verifying'|'ok'|'error'>('idle');
  message = signal('');

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
      if (token) {
        this.state.set('verifying');
        this.api.verify(token).subscribe({
          next: (res) => {
            if (res.success) { this.state.set('ok'); this.message.set(res.message || ''); }
            else { this.state.set('error'); this.message.set(res.message || 'Token inválido.'); }
          },
          error: (err) => {
            this.state.set('error');
            this.message.set(err?.error?.message || 'Error al verificar.');
          }
        });
      }
    });
  }

  resend(){
    this.api.resend().subscribe({
      next: (res) => { this.message.set(res.message || 'Correo reenviado.'); },
      error: (err) => { this.message.set(err?.error?.message || 'No se pudo reenviar.'); }
    });
  }
}
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { EmailVerificationService } from '../services/email.verification';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './email-verification.html',
  styleUrls: ['./email-verification.scss'],
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

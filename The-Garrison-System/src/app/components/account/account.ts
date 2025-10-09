import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/user/user';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account.html',
  styleUrls: ['./account.scss'],
})
export class AccountComponent {
  private users = inject(UsersService);
  private auth  = inject(AuthService);

  loading = signal(false);
  saving  = signal(false);
  error   = signal<string | null>(null);
  ok      = signal<string | null>(null);

  // atajo para el template
  me() { return this.auth.user(); }

  ngOnInit() {
    this.loading.set(true);
    this.users.getMe().subscribe({
      next: (u) => { this.auth.user.set(u); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  save(form: HTMLFormElement) {
    this.saving.set(true);
    this.error.set(null);
    this.ok.set(null);

    const payload = {
      username: (form as any).username?.value,
      firstName: (form as any).firstName?.value,
      lastName:  (form as any).lastName?.value,
      phone:     (form as any).phone?.value,
      address:   (form as any).address?.value,
    };

    this.users.updateMe(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.ok.set('Datos guardados');
      },
      error: (err) => {
        this.saving.set(false);
        // Si el backend no tiene endpoint, mensaje claro
        const msg = err?.message || err?.error?.message || 'No se pudo guardar';
        this.error.set(msg);
      }
    });
  }
}

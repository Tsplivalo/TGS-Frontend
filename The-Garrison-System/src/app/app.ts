// src/app/app.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth/auth';
import { I18nService } from './services/i18n/i18n';
import { NavbarComponent } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  ngOnInit(): void {
    console.log('[AppComponent] Initializing...');
    
    // ✅ I18nService ya se inicializa en su constructor
    console.log('[AppComponent] Current language:', this.i18n.current);
    
    // ✅ Inicializar AuthService
    this.auth.initialize();
  }
}
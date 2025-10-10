import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private t = inject(TranslateService);

  get current() { return this.t.currentLang || this.t.defaultLang || 'en'; }

  use(lang: 'en' | 'es') {
    this.t.use(lang);
    localStorage.setItem('lang', lang);
  }

  initFromStorage() {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'es') {
      this.t.use(saved);
    }
  }
}

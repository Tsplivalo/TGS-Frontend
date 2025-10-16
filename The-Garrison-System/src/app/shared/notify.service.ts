import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private queue: string[] = [];
  info(msg: string)  { this.push(`ℹ️ ${msg}`); }
  ok(msg: string)    { this.push(`✅ ${msg}`); }
  warn(msg: string)  { this.push(`⚠️ ${msg}`); }
  err(msg: string)   { this.push(`❌ ${msg}`); }

  private push(msg: string) {
    this.queue.push(msg);
    try { console.log('[Toast]', msg); } catch {}
    try { (window as any).Toastify ? (window as any).Toastify({ text: msg, gravity: 'top', position: 'right', close: true }).showToast()
                                   : alert(msg); } catch { alert(msg); }
  }
}

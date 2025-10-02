import { Component, Input } from '@angular/core';
selector: 'tgs-page-header',
standalone: true,
template: `
<header class="px-4 py-8 md:py-10 border-b bg-[var(--bg-elev)]">
<div class="max-w-6xl mx-auto">
<nav aria-label="breadcrumbs" class="text-sm mb-3 text-gray-500">
<ng-content select="[breadcrumbs]"></ng-content>
</nav>
<h1 class="text-3xl md:text-4xl font-semibold tracking-tight">{{title}}</h1>
<p class="mt-2 text-gray-600" *ngIf="subtitle">{{subtitle}}</p>
</div>
</header>
`,
styles: [
`:host{display:block}
:root{--bg-elev:rgba(250,250,250,.7)}
`
]
})
export class PageHeaderComponent {
@Input() title = '';
@Input() subtitle?: string;
}


// =============================================
// 🔔 shared/ui/toast.service.ts (toasts simples)
// =============================================
import { Injectable, signal } from '@angular/core';


export type Toast = { id: number; type: 'success'|'error'|'warning'|'info'; message: string };


@Injectable({ providedIn: 'root' })
export class ToastService {
private _toasts = signal<Toast[]>([]);
private _id = 1;
toasts = this._toasts.asReadonly();


show(message: string, type: Toast['type'] = 'info', timeout = 3500) {
const id = this._id++;
const t = { id, type, message } as Toast;
this._toasts.update(list => [...list, t]);
if (timeout) setTimeout(() => this.dismiss(id), timeout);
}
dismiss(id: number) {
this._toasts.update(list => list.filter(t => t.id !== id));
}
}
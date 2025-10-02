import { Component, computed } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { ToastService } from './toast.service';


@Component({
selector: 'tgs-toast-container',
standalone: true,
imports: [NgFor, NgClass],
template: `
<section class="fixed right-4 top-4 z-[1000] space-y-2">
<article *ngFor="let t of toasts()" class="rounded-2xl shadow p-3 min-w-64 max-w-96 text-sm bg-white border"
[ngClass]="{
'border-green-300': t.type==='success',
'border-red-300': t.type==='error',
'border-yellow-300': t.type==='warning',
'border-blue-300': t.type==='info'
}"
role="status" aria-live="polite">
<div class="font-medium mb-1">{{ t.type | titlecase }}</div>
<p>{{ t.message }}</p>
</article>
</section>
`,
})
export class ToastContainerComponent {
toasts = computed(() => this.toastSvc.toasts());
constructor(private toastSvc: ToastService) {}
}


// =============================================
// 🧭 pages/about/about.routes.ts
// =============================================
import { Routes } from '@angular/router';
import { AboutComponent } from './about.component';


export const ABOUT_ROUTES: Routes = [
{ path: '', component: AboutComponent, title: 'Sobre nosotros' }
];
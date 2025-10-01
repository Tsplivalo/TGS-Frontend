import { Component, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { ToastService } from '../../shared/ui/toast.service';
import { ContactService } from './contact.service';


@Component({
selector: 'tgs-contact',
standalone: true,
imports: [ReactiveFormsModule, PageHeaderComponent],
templateUrl: './contact.component.html',
styleUrls: ['./contact.component.css']
})
export class ContactComponent {
loading = false;
form = this.fb.group({
name: ['', [Validators.required, Validators.minLength(2)]],
email: ['', [Validators.required, Validators.email]],
subject: ['', [Validators.required, Validators.maxLength(120)]],
message: ['', [Validators.required, Validators.minLength(10)]],
agree: [false, [Validators.requiredTrue]]
});


constructor(private fb: FormBuilder, private svc: ContactService, private toast: ToastService) {
// feedback accesible al cambiar estado del formulario
effect(() => {
if (this.form.invalid) return;
});
}


async submit(){
if (this.form.invalid) {
this.form.markAllAsTouched();
this.toast.show('Por favor, completa los campos requeridos.', 'warning');
return;
}
this.loading = true;
try {
await this.svc.send(this.form.getRawValue() as any);
this.toast.show('Mensaje enviado. ¡Gracias por contactarnos!','success');
this.form.reset({ agree: false });
} catch (e) {
this.toast.show('Ocurrió un error al enviar. Intenta nuevamente.','error');
} finally {
this.loading = false;
}
}
}
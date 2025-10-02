import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'tgs-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent {
  loading = false;
  submitted = false;
  errorMsg = '';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.maxLength(120)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
    agree: [false, [Validators.requiredTrue]],
  });

  constructor(private fb: FormBuilder) {}

  async submit() {
    this.submitted = false;
    this.errorMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Por favor, completa los campos requeridos.';
      return;
    }
    this.loading = true;
    try {
      // Simula envío
      await new Promise((r) => setTimeout(r, 800));
      this.submitted = true;
      this.form.reset({ agree: false });
    } catch {
      this.errorMsg = 'Ocurrió un error al enviar. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }
}

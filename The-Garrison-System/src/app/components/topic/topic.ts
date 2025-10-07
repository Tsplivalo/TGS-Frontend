import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';

import { TopicService } from '../../services/topic/topic';
import { TopicDTO, CreateTopicDTO, UpdateTopicDTO } from '../../models/topic/topic.model';

type TopicForm = {
  id: FormControl<number | null>;
  description: FormControl<string>;
};

@Component({
  selector: 'app-topic',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './topic.html',
  styleUrls: ['./topic.scss'],
})
export class TopicComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(TopicService);

  topics = signal<TopicDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  filterText = '';
  isEdit = signal(false);

  form: FormGroup<TopicForm> = this.fb.group<TopicForm>({
    id: this.fb.control<number | null>(null),
    description: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(1)] }),
  });

  ngOnInit(): void {
    this.load();
  }

  filtered = computed(() => {
    const q = (this.filterText || '').toLowerCase().trim();
    if (!q) return this.topics();
    return this.topics().filter(t =>
      (t.description || '').toLowerCase().includes(q) ||
      String(t.id ?? '').includes(q)
    );
  });

  load() {
    this.loading.set(true);
    this.error.set(null);
    // ⬇️ getAll(): Observable<TopicDTO[]>
    this.srv.getAll().subscribe({
      next: (list: TopicDTO[]) => {
        this.topics.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudieron cargar las temáticas.');
        this.loading.set(false);
      }
    });
  }

  new() {
    this.isEdit.set(false);
    this.form.reset({ id: null, description: '' });
    this.error.set(null);
  }

  edit(t: TopicDTO) {
    this.isEdit.set(true);
    this.form.setValue({
      id: t.id ?? null,
      description: t.description ?? '',
    });
    this.error.set(null);
  }

  delete(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo eliminar.');
        this.loading.set(false);
      }
    });
  }

  private buildCreate(): CreateTopicDTO {
    const v = this.form.getRawValue();
    return { description: String(v.description).trim() };
  }

  private buildUpdate(): UpdateTopicDTO {
    const v = this.form.getRawValue();
    return { description: String(v.description).trim() };
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completá la descripción.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const id = this.form.controls.id.value;

    if (!id) {
      // CREATE => Observable<TopicDTO>
      const payload = this.buildCreate();
      this.srv.create(payload).subscribe({
        next: (_created: TopicDTO) => { this.new(); this.load(); },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudo crear.');
          this.loading.set(false);
        }
      });
      return;
    }

    // UPDATE (PATCH) => Observable<TopicDTO>
    const payload = this.buildUpdate();
    this.srv.update(id, payload).subscribe({
      next: (_updated: TopicDTO) => { this.new(); this.load(); },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo guardar.');
        this.loading.set(false);
      }
    });
  }
}

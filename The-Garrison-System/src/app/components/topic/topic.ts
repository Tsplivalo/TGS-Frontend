import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, Validators, FormGroup, FormControl
} from '@angular/forms';
import {
  TopicService
} from '../../services/topic/topic';
import {
  TopicDTO,
  CreateTopicDTO,
  UpdateTopicDTO,
  ApiResponse
} from '../../models/topic/topic.model';

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
  submitted = signal(false);

  // edit
  isEdit = signal(false);

  // simple filter
  fText = '';

  form: FormGroup<TopicForm> = this.fb.group<TopicForm>({
    id: this.fb.control<number | null>(null),
    description: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(1)] }),
  });

  ngOnInit(): void {
    this.load();
  }

  filteredTopics = computed(() => {
    const q = (this.fText || '').toLowerCase().trim();
    if (!q) return this.topics();
    return this.topics().filter(t => (t.description || '').toLowerCase().includes(q) || String(t.id).includes(q));
  });

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (res: ApiResponse<TopicDTO[]>) => {
        this.topics.set(res?.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not load topics.');
        this.loading.set(false);
      }
    });
  }

  isFormOpen = false;
  toggleForm(){ this.isFormOpen = !this.isFormOpen; }

  new() {
    this.isEdit.set(false);
    this.form.reset({ id: null, description: '' });
    this.submitted.set(false);
  }

  edit(t: TopicDTO) {
    this.isEdit.set(true);
    this.form.setValue({ id: t.id, description: t.description || '' });
    this.submitted.set(false);
  }

  delete(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not delete.');
        this.loading.set(false);
      }
    });
  }

  private buildCreate(): CreateTopicDTO {
    return { description: String(this.form.controls.description.value || '').trim() };
  }

  private buildUpdate(): UpdateTopicDTO {
    return { description: String(this.form.controls.description.value || '').trim() || undefined };
  }

  save() {
    this.submitted.set(true);

    if (this.form.controls.description.invalid) {
      this.form.controls.description.markAsTouched();
      this.error.set('Complete the description.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!this.isEdit()) {
      this.srv.create(this.buildCreate()).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => {
          this.error.set(err?.error?.message || 'Could not create.');
          this.loading.set(false);
        }
      });
      return;
    }

    const id = this.form.controls.id.value!;
    this.srv.update(id, this.buildUpdate()).subscribe({
      next: () => { this.new(); this.load(); },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not save.');
        this.loading.set(false);
      }
    });
  }
}
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, Validators, FormGroup, FormControl
} from '@angular/forms';

import { DecisionService } from '../../services/decision/decision';
import {
  DecisionDTO, CreateDecisionDTO, PatchDecisionDTO, ApiResponse as ApiDecisionResp
} from '../../models/decision/decision.model';

import { TopicService } from '../../services/topic/topic';
import { TopicDTO, ApiResponse as ApiTopicResp } from '../../models/topic/topic.model';

type DecisionForm = {
  id: FormControl<number | null>;
  topicId: FormControl<number | null>;
  description: FormControl<string>;
  startDate: FormControl<string>; // yyyy-MM-dd
  endDate: FormControl<string>;    // yyyy-MM-dd
};

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './decision.html',
  styleUrls: ['./decision.scss'],
})
export class DecisionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(DecisionService);
  private topicSrv = inject(TopicService);

  decisions = signal<DecisionDTO[]>([]);
  topics = signal<TopicDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);
  isEdit = signal(false);

  // filters
  fText = '';
  topicFilter = '';

  // today in input date format
  today = this.todayLocalInput();

  form: FormGroup<DecisionForm> = this.fb.group<DecisionForm>({
    id: this.fb.control<number | null>(null),
    topicId: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    description: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(1)] }),
    startDate: this.fb.nonNullable.control(this.today, { validators: [Validators.required] }),
    endDate: this.fb.nonNullable.control(this.today, { validators: [Validators.required] }),
  });

  isFormOpen = false;
  toggleForm(){ this.isFormOpen = !this.isFormOpen; }


  ngOnInit(): void {
    // If the <select> for topics emits a string, convert it to a number
    this.form.controls.topicId.valueChanges.subscribe((v) => {
      if (typeof v === 'string' && v !== '') {
        const n = Number(v);
        if (!Number.isNaN(n)) this.form.controls.topicId.setValue(n, { emitEvent: false });
      }
    });

    // Enforce min today: if someone manually overrides, correct it
    this.form.controls.startDate.valueChanges.subscribe((v) => {
      if (v && v < this.today) this.form.controls.startDate.setValue(this.today, { emitEvent: false });
      // if endDate is before startDate, adjust it
      if (this.form.controls.endDate.value && this.form.controls.endDate.value < (this.form.controls.startDate.value || '')) {
        this.form.controls.endDate.setValue(this.form.controls.startDate.value!, { emitEvent: false });
      }
    });
    this.form.controls.endDate.valueChanges.subscribe((v) => {
      const fi = this.form.controls.startDate.value || this.today;
      if (v && v < fi) this.form.controls.endDate.setValue(fi, { emitEvent: false });
    });

    this.load();
    this.loadTopics();
  }

  // ===== Utils =====
  private todayLocalInput(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  filteredDecisions = computed(() => {
    const q = (this.fText || '').toLowerCase().trim();
    const tFilter = (this.topicFilter || '').trim();
    return this.decisions().filter(d => {
  const matchText = !q || (d.description || '').toLowerCase().includes(q) || String(d.id).includes(q);
  const topicId = d.topic?.id != null ? String(d.topic.id) : '';
  const matchTopic = !tFilter || topicId === tFilter;
  return matchText && matchTopic;
    });
  });

  filteredTopics = computed(() => {
    const q = (this.topicFilter || '').toLowerCase().trim();
    if (!q) return this.topics();
    return this.topics().filter(t =>
      (t.description || '').toLowerCase().includes(q) ||
      String(t.id).includes(q)
    );
  });

  // ===== Data =====
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (res: ApiDecisionResp<DecisionDTO[]>) => {
        this.decisions.set(res?.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not load decisions.');
        this.loading.set(false);
      }
    });
  }

  loadTopics() {
    this.topicSrv.getAll().subscribe({
      next: (res: ApiTopicResp<TopicDTO[]>) => {
        this.topics.set(res?.data || []);
      },
      error: (err) => console.warn('[DECISION] Could not load topics:', err)
    });
  }

  // ===== CRUD UI =====
  new() {
    this.isEdit.set(false);
    this.form.reset({
      id: null,
      topicId: null,
      description: '',
      startDate: this.today,
      endDate: this.today,
    });
    this.submitted.set(false);
    this.error.set(null);
  }

  edit(d: DecisionDTO) {
    this.isEdit.set(true);
    this.form.setValue({
      id: d.id,
      topicId: d.topic?.id ?? null,
      description: d.description || '',
      startDate: (d.startDate || '').slice(0, 10),
      endDate: (d.endDate || '').slice(0, 10),
    });
    this.submitted.set(false);
    this.error.set(null);
  }

  delete(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not delete (check the route in the backend).');
        this.loading.set(false);
      }
    });
  }

  // ===== Builders =====
  private buildCreate(): CreateDecisionDTO {
    const v = this.form.getRawValue();
    return {
      topicId: Number(v.topicId),
      description: String(v.description).trim(),
      startDate: String(v.startDate),
      endDate: String(v.endDate),
    };
  }

  private buildPatch(): PatchDecisionDTO {
    const v = this.form.getRawValue();
    return {
      topicId: v.topicId != null ? Number(v.topicId) : undefined,
      description: v.description?.trim() || undefined,
      startDate: v.startDate || undefined,
      endDate: v.endDate || undefined,
    };
  }

  private areDatesValid(): boolean {
    const fi = this.form.controls.startDate.value || '';
    const ff = this.form.controls.endDate.value || '';
    // already constrained by min and subs, but we validate anyway
    return !!fi && !!ff && ff >= fi && fi >= this.today;
  }

  save() {
    this.submitted.set(true);

    // Normalize empty select
    const t = this.form.controls.topicId.value;
    if ((t as any) === '') this.form.controls.topicId.setValue(null);

    const baseInvalid = this.form.invalid;
    const datesInvalid = !this.areDatesValid();

    if (baseInvalid || datesInvalid) {
      this.form.markAllAsTouched();
      const msgs: string[] = [];
      if (this.form.controls.topicId.invalid) msgs.push('Topic');
      if (this.form.controls.description.invalid) msgs.push('Description');
      if (datesInvalid) msgs.push('Dates (start ≥ today and end ≥ start)');
      this.error.set(`Complete correctly: ${msgs.join(', ')}.`);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!this.isEdit()) {
      // CREATE
      const payload = this.buildCreate();
      this.srv.create(payload).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => {
          const raw = err?.error;
          const msg = raw?.message || (typeof raw === 'string' ? raw : 'Could not create.');
          this.error.set(msg);
          this.loading.set(false);
        }
      });
      return;
    }

    // EDIT (PATCH)
    const id = this.form.controls.id.value!;
    const payload = this.buildPatch();
    this.srv.update(id, payload).subscribe({
      next: () => { this.new(); this.load(); },
      error: (err) => {
        const raw = err?.error;
        const msg = raw?.message || (typeof raw === 'string' ? raw : 'Could not save.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ZoneService } from '../../services/zone/zone';
import {
  ApiResponse,
  ZoneDTO,
  CreateZoneDTO
} from '../../models/zone/zone.model';

@Component({
  selector: 'app-zone',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './zone.html',
  styleUrls: ['./zone.scss']
})
export class ZoneComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(ZoneService);

  // UI state
  loading = signal(false);
  error   = signal<string | null>(null); // used as an error box
  editId  = signal<number | null>(null);

  // data
  zones = signal<ZoneDTO[]>([]);

  // filters
  fText = signal('');

  filteredList = computed(() => {
    const txt = this.fText().toLowerCase().trim();
    return this.zones().filter(z => {
      const matchText = !txt
        || String(z.id).includes(txt)
        || z.nombre.toLowerCase().includes(txt)
        || (z.descripcion ?? '').toLowerCase().includes(txt);
      return matchText;
    });
  });

  // current headquarters (to show above)
  headquarters = computed(() => this.zones().find(z => z.esSedeCentral) ?? null);

  // form
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    isHeadquarters: [false],
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllZones().subscribe({
      next: (r: ApiResponse<ZoneDTO[]>) => { this.zones.set(r.data ?? []); this.loading.set(false); },
      error: () => { this.error.set('Could not load zones.'); this.loading.set(false); }
    });
  }

  new() {
    this.editId.set(null);
    this.form.reset({ name: '', description: '', isHeadquarters: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.error.set(null); // clear visual errors
  }

  edit(z: ZoneDTO) {
    this.editId.set(z.id);
    this.form.patchValue({
      name: z.nombre,
      description: z.descripcion ?? '',
      isHeadquarters: !!z.esSedeCentral
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.error.set(null);
  }

  // inside the Zones component
isFormOpen = false;

toggleForm() {
  // if you were editing, you could optionally reset:
  //if (!this.isFormOpen) this.new();
  this.isFormOpen = !this.isFormOpen;
}

  save() {
    this.error.set(null);

    const raw = this.form.getRawValue();
    const id = this.editId();

    // normalize
    const name = (raw.name ?? '').trim();
    const payloadCreate = {
      name,
      description: raw.description?.toString().trim() ? raw.description.toString().trim() : undefined,
      isHeadquarters: !!raw.isHeadquarters,
    };
    const payloadUpdate = { ...payloadCreate };

    // 👉 CREATE (same as before)
    if (id == null) {
      this.srv.createZone(payloadCreate).subscribe({
        next: () => { this.new(); this.load(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        error: (e) => this.handleSaveError(e),
      });
      return;
    }

    this.srv.isNameAvailable(name, id).subscribe(isFree => {
      if (!isFree) {
        // same behavior as in create
        this.error.set('A zone with that name already exists (regardless of case).');
        const ctrl = this.form.controls['name'];
        ctrl.setErrors({ ...(ctrl.errors ?? {}), duplicateName: true });
        ctrl.markAsTouched();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // if it's free, update
      this.srv.updateZone(id, payloadUpdate).subscribe({
        next: () => { this.new(); this.load(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        error: (e) => this.handleSaveError(e),
      });
    });
  }

  // error handling helper (reuses your current logic)
  private handleSaveError(e: any) {
    const backendMsg = e?.error?.message?.toString();

    if (e?.status === 409) {
      const msg = backendMsg || 'A zone with that name already exists (regardless of case).';
      this.error.set(msg);
      const ctrl = this.form.controls['name'];
      ctrl.setErrors({ ...(ctrl.errors ?? {}), duplicateName: true });
      ctrl.markAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (e?.status === 400 && backendMsg) {
      this.error.set(backendMsg);
      if (/name/i.test(backendMsg)) {
        const ctrl = this.form.controls['name'];
        ctrl.setErrors({ ...(ctrl.errors ?? {}), required: true });
        ctrl.markAsTouched();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.error.set(backendMsg || 'Could not save the zone.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  delete(z: ZoneDTO) {
    // If it is headquarters, do not delete and show error box
    if (z.esSedeCentral) {
      this.error.set(
        `Cannot delete zone "${z.nombre}" because it is the current headquarters. ` +
        `To delete it, first assign another zone as headquarters.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!confirm(`Delete zone "${z.nombre}"?`)) return;

    this.loading.set(true);
    this.srv.deleteZone(z.id).subscribe({
      next: () => { this.error.set(null); this.load(); },
      error: (e) => {
        console.error(e);
        this.error.set('Could not delete.');
        this.loading.set(false);
      }
    });
  }
}

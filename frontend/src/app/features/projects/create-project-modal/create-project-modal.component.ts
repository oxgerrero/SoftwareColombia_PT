import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import type { Project } from '../../../core/models';

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         (click)="onBackdropClick($event)">

      <div class="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6"
           (click)="$event.stopPropagation()">

        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-white">
            {{ isEditMode ? 'Editar Proyecto' : 'Nuevo Proyecto' }}
          </h2>
          <button (click)="close.emit()" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

          @if (error()) {
            <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5">
              {{ error() }}
            </div>
          }

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-300">
              Nombre <span class="text-red-400">*</span>
            </label>
            <input formControlName="name" maxlength="255" placeholder="Nombre del proyecto"
              class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-300">Descripción</label>
            <textarea formControlName="description" rows="3" placeholder="Descripción opcional..."
              class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     transition resize-none"></textarea>
          </div>

          <div class="flex gap-3 pt-1">
            <button type="button" (click)="close.emit()"
              class="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg py-2.5 text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" [disabled]="loading() || form.invalid"
              class="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
              {{ loading() ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Guardar cambios' : 'Crear Proyecto') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CreateProjectModalComponent implements OnInit {
  @Input() project: Project | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Project>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  readonly loading = signal(false);
  readonly error = signal('');

  get isEditMode(): boolean {
    return !!this.project;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly projectService: ProjectService,
  ) {}

  ngOnInit(): void {
    if (this.project) {
      this.form.patchValue({
        name: this.project.name,
        description: this.project.description ?? '',
      });
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close.emit();
  }

  submit(): void {
    if (this.form.invalid) return;
    const { name, description } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');

    const request$ = this.isEditMode
      ? this.projectService.update(this.project!.id, name.trim(), description.trim())
      : this.projectService.create(name.trim(), description.trim());

    request$.subscribe({
      next: (project) => { this.saved.emit(project); this.close.emit(); },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.loading.set(false); },
    });
  }
}

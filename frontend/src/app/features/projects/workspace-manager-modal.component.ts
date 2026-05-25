import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../core/services/workspace.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import type { Member, Role, WorkspaceAccess } from '../../core/models';

type Tab = 'members' | 'danger';

const ROLES: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'reader', label: 'Lector' },
];

@Component({
  selector: 'app-workspace-manager-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         (click)="onBackdropClick($event)">
      <div class="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
          <div>
            <h2 class="text-lg font-semibold text-white">Gestionar workspace</h2>
            <p class="text-gray-400 text-xs mt-0.5">{{ workspace.name }}</p>
          </div>
          <button (click)="close.emit()" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-800 px-6">
          <button (click)="tab.set('members')"
            [class]="tab() === 'members'
              ? 'text-indigo-400 border-b-2 border-indigo-400 font-medium'
              : 'text-gray-400 hover:text-white'"
            class="text-sm py-3 mr-6 transition-colors">
            Miembros
          </button>
          <button (click)="tab.set('danger')"
            [class]="tab() === 'danger'
              ? 'text-red-400 border-b-2 border-red-400 font-medium'
              : 'text-gray-400 hover:text-white'"
            class="text-sm py-3 transition-colors">
            Zona de peligro
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6">

          <!-- ── Members tab ────────────────────────────────────────────── -->
          @if (tab() === 'members') {
            <!-- Add member form -->
            <form [formGroup]="addForm" (ngSubmit)="addMember()" class="flex gap-2 mb-5">
              <input formControlName="email" type="email" placeholder="correo@ejemplo.com"
                class="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              <select formControlName="role"
                class="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                @for (r of roles; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
              </select>
              <button type="submit" [disabled]="addLoading() || addForm.invalid"
                class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium
                       rounded-lg px-3 py-2 transition-colors shrink-0">
                Añadir
              </button>
            </form>

            @if (addError()) {
              <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
                {{ addError() }}
              </div>
            }

            <!-- Members list -->
            @if (membersLoading()) {
              <p class="text-gray-400 text-sm text-center py-6">Cargando miembros...</p>
            } @else {
              <div class="space-y-2">
                @for (m of members(); track m.user_id) {
                  <div class="flex items-center justify-between gap-3 bg-gray-800 rounded-xl px-4 py-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
                        <span class="text-indigo-400 text-xs font-bold">
                          {{ (m.full_name || m.email)[0].toUpperCase() }}
                        </span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-white text-sm truncate">{{ m.full_name }}</p>
                        <p class="text-gray-400 text-xs truncate">{{ m.email }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <select [value]="m.role" (change)="changeRole(m, $any($event.target).value)"
                        class="bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-xs
                               focus:outline-none focus:ring-1 focus:ring-indigo-500 transition">
                        @for (r of roles; track r.value) {
                          <option [value]="r.value">{{ r.label }}</option>
                        }
                      </select>
                      <button (click)="removeMember(m)" title="Eliminar miembro"
                        class="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            @if (memberActionError()) {
              <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mt-3">
                {{ memberActionError() }}
              </div>
            }
          }

          <!-- ── Danger zone tab ────────────────────────────────────────── -->
          @if (tab() === 'danger') {
            <div class="space-y-4">
              <p class="text-gray-400 text-sm">
                Eliminar el workspace borrará todos sus proyectos y membresías de forma permanente.
                Esta acción <strong class="text-red-400">no se puede deshacer</strong>.
              </p>

              @if (!confirmDelete()) {
                <button (click)="confirmDelete.set(true)"
                  class="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30
                         text-red-400 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar workspace
                </button>
              } @else {
                <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                  <p class="text-red-300 text-sm font-medium">¿Seguro? Escribe el nombre del workspace para confirmar:</p>
                  <input [(ngModel)]="deleteConfirmName" [ngModelOptions]="{standalone: true}"
                    [placeholder]="workspace.name"
                    class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" />
                  <div class="flex gap-2">
                    <button (click)="confirmDelete.set(false); deleteConfirmName = ''"
                      class="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 text-sm transition-colors">
                      Cancelar
                    </button>
                    <button (click)="deleteWorkspace()"
                      [disabled]="deleteConfirmName !== workspace.name || deleteLoading()"
                      class="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed
                             text-white font-semibold rounded-lg py-2 text-sm transition-colors">
                      {{ deleteLoading() ? 'Eliminando...' : 'Sí, eliminar' }}
                    </button>
                  </div>
                </div>
              }

              @if (deleteError()) {
                <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
                  {{ deleteError() }}
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class WorkspaceManagerModalComponent implements OnInit {
  @Input({ required: true }) workspace!: WorkspaceAccess;
  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  readonly roles = ROLES;
  readonly tab = signal<Tab>('members');

  readonly members = signal<Member[]>([]);
  readonly membersLoading = signal(true);

  readonly addForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['editor' as Role, Validators.required],
  });
  readonly addLoading = signal(false);
  readonly addError = signal('');
  readonly memberActionError = signal('');

  readonly confirmDelete = signal(false);
  deleteConfirmName = '';
  readonly deleteLoading = signal(false);
  readonly deleteError = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly workspaceService: WorkspaceService,
  ) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close.emit();
  }

  private loadMembers(): void {
    this.membersLoading.set(true);
    this.workspaceService.listMembers(this.workspace.id).subscribe({
      next: (m) => { this.members.set(m); this.membersLoading.set(false); },
      error: () => this.membersLoading.set(false),
    });
  }

  addMember(): void {
    if (this.addForm.invalid) return;
    const { email, role } = this.addForm.getRawValue();
    this.addLoading.set(true);
    this.addError.set('');

    this.workspaceService.addMember(this.workspace.id, email, role).subscribe({
      next: (m) => {
        this.members.update((prev) => [...prev, m]);
        this.addForm.reset({ role: 'editor' });
        this.addLoading.set(false);
      },
      error: (err) => {
        this.addError.set(extractErrorMessage(err));
        this.addLoading.set(false);
      },
    });
  }

  changeRole(member: Member, newRole: Role): void {
    this.memberActionError.set('');
    this.workspaceService.changeMemberRole(this.workspace.id, member.user_id, newRole).subscribe({
      next: (updated) => {
        this.members.update((prev) =>
          prev.map((m) => (m.user_id === updated.user_id ? updated : m)),
        );
      },
      error: (err) => this.memberActionError.set(extractErrorMessage(err)),
    });
  }

  removeMember(member: Member): void {
    this.memberActionError.set('');
    this.workspaceService.removeMember(this.workspace.id, member.user_id).subscribe({
      next: () => this.members.update((prev) => prev.filter((m) => m.user_id !== member.user_id)),
      error: (err) => this.memberActionError.set(extractErrorMessage(err)),
    });
  }

  deleteWorkspace(): void {
    this.deleteLoading.set(true);
    this.deleteError.set('');
    this.workspaceService.delete(this.workspace.id).subscribe({
      next: () => { this.deleted.emit(); this.close.emit(); },
      error: (err) => {
        this.deleteError.set(extractErrorMessage(err));
        this.deleteLoading.set(false);
      },
    });
  }
}

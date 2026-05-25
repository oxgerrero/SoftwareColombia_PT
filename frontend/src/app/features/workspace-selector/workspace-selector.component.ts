import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import { WorkspaceFormModalComponent } from './workspace-form-modal.component';
import type { WorkspaceAccess, WorkspaceOut } from '../../core/models';

interface RoleMeta { label: string; classes: string }

const ROLE_META: Record<string, RoleMeta> = {
  admin:  { label: 'Admin',  classes: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
  editor: { label: 'Editor', classes: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  reader: { label: 'Lector', classes: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

@Component({
  selector: 'app-workspace-selector',
  standalone: true,
  imports: [WorkspaceFormModalComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex flex-col items-center justify-center p-6">
      <div class="w-full max-w-2xl">

        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-white">Selecciona un Workspace</h1>
            <p class="text-gray-400 text-sm mt-1">
              Bienvenido, <span class="text-indigo-400 font-medium">{{ auth.user()?.full_name }}</span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <a routerLink="/settings"
              class="text-sm text-gray-400 hover:text-white transition-colors">
              Configuración
            </a>
            <button (click)="logout()" class="text-sm text-gray-400 hover:text-red-400 transition-colors">
              Salir
            </button>
          </div>
        </div>

        @if (error()) {
          <div class="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {{ error() }}
          </div>
        }

        <!-- Workspace grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          @for (ws of auth.workspaces(); track ws.id) {
            <div class="group relative bg-gray-900 border border-gray-800 hover:border-indigo-500/50 rounded-2xl p-6
                        transition-all duration-200 hover:shadow-lg hover:shadow-indigo-900/20">

              @if (ws.role === 'admin') {
                <button (click)="openEdit(ws)" title="Editar workspace"
                  class="absolute top-4 right-4 p-1.5 text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/10
                         rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              }

              <button (click)="select(ws)" [disabled]="!!selecting()" class="w-full text-left">
                <!-- Icon -->
                <div class="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-4
                            group-hover:bg-indigo-600/30 transition-colors">
                  <svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>

                <div class="flex items-start justify-between gap-2 pr-6">
                  <h3 class="font-semibold text-white">{{ ws.name }}</h3>
                  <span class="shrink-0 text-xs px-2 py-0.5 rounded-full {{ roleMeta(ws.role).classes }}">
                    {{ roleMeta(ws.role).label }}
                  </span>
                </div>

                @if (ws.description) {
                  <p class="text-gray-400 text-sm mt-1.5 line-clamp-2">{{ ws.description }}</p>
                }

                <div class="mt-4 text-indigo-400 text-sm font-medium flex items-center gap-1">
                  @if (selecting() === ws.id) {
                    <span>Entrando...</span>
                  } @else {
                    <span>Entrar</span>
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  }
                </div>
              </button>
            </div>
          }

          <!-- Create new workspace card -->
          <button (click)="openCreate()"
            class="text-left bg-gray-900/50 border border-dashed border-gray-700 hover:border-indigo-500/50
                   rounded-2xl p-6 transition-all duration-200 group">
            <div class="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center mb-4
                        group-hover:bg-indigo-600/20 transition-colors">
              <svg class="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-400 group-hover:text-white transition-colors">Nuevo workspace</h3>
            <p class="text-gray-600 text-sm mt-1">Crea un espacio de trabajo</p>
          </button>
        </div>

      </div>
    </div>

    @if (showModal()) {
      <app-workspace-form-modal
        [workspace]="editingWorkspace()"
        (close)="closeModal()"
        (saved)="onSaved($event)" />
    }
  `,
})
export class WorkspaceSelectorComponent {
  readonly selecting = signal<string | null>(null);
  readonly error = signal('');
  readonly showModal = signal(false);
  readonly editingWorkspace = signal<WorkspaceAccess | null>(null);

  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  roleMeta(role: string): RoleMeta {
    return ROLE_META[role] ?? ROLE_META['reader'];
  }

  openCreate(): void {
    this.editingWorkspace.set(null);
    this.showModal.set(true);
  }

  openEdit(ws: WorkspaceAccess): void {
    this.editingWorkspace.set(ws);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingWorkspace.set(null);
  }

  onSaved(ws: WorkspaceOut): void {
    if (this.editingWorkspace()) {
      this.auth.updateWorkspaceInList(ws);
    } else {
      this.auth.addWorkspaceToList(ws);
    }
  }

  async select(ws: WorkspaceAccess): Promise<void> {
    this.error.set('');
    this.selecting.set(ws.id);
    try {
      await this.auth.selectWorkspace(ws.id);
      this.router.navigate(['/projects']);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
      this.selecting.set(null);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

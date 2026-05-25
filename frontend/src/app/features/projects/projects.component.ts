import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { CreateProjectModalComponent } from './create-project-modal/create-project-modal.component';
import { WorkspaceManagerModalComponent } from './workspace-manager-modal.component';
import { extractErrorMessage } from '../../core/utils/http-error.util';
import type { Project } from '../../core/models';

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', editor: 'Editor', reader: 'Lector' };

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CreateProjectModalComponent, WorkspaceManagerModalComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-950 flex flex-col">

      <!-- Topbar -->
      <header class="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p class="text-white font-semibold text-sm leading-tight">{{ auth.currentWorkspace()?.name }}</p>
              <p class="text-gray-500 text-xs">{{ roleLabel(auth.currentWorkspace()?.role) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-gray-400 text-sm hidden sm:block">{{ auth.user()?.email }}</span>
            @if (isAdmin()) {
              <button (click)="showManager.set(true)" title="Gestionar workspace"
                class="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            }
            <a routerLink="/settings"
              class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Configuración">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </a>
            <button (click)="changeWorkspace()" class="text-xs text-gray-400 hover:text-white transition-colors">
              Cambiar workspace
            </button>
            <button (click)="logout()" class="text-xs text-gray-400 hover:text-red-400 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      <!-- Main -->
      <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

        <!-- Page header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-bold text-white">Proyectos</h1>
            <p class="text-gray-400 text-sm mt-0.5">
              {{ projects().length }} proyecto{{ projects().length !== 1 ? 's' : '' }}
            </p>
          </div>
          @if (auth.canWrite()) {
            <button (click)="openCreate()"
              class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm
                     font-semibold rounded-lg px-4 py-2.5 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Crear Proyecto
            </button>
          }
        </div>

        <!-- Reader notice -->
        @if (!auth.canWrite()) {
          <div class="mb-5 flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10
                      border border-amber-500/20 rounded-lg px-4 py-2.5">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Solo tienes acceso de lectura en este workspace.
          </div>
        }

        <!-- Loading -->
        @if (loading()) {
          <div class="flex items-center justify-center py-20 text-gray-400">
            <svg class="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cargando proyectos...
          </div>
        }

        <!-- Error -->
        @if (error() && !loading()) {
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ error() }}
          </div>
        }

        <!-- Empty -->
        @if (!loading() && !error() && projects().length === 0) {
          <div class="text-center py-20">
            <div class="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p class="text-gray-400 text-sm">No hay proyectos en este workspace.</p>
          </div>
        }

        <!-- Projects list -->
        @if (!loading() && !error() && projects().length > 0) {
          <div class="space-y-3">
            @for (p of projects(); track p.id) {

              <!-- Confirm delete row -->
              @if (confirmDeleteId() === p.id) {
                <div class="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4
                            flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 min-w-0">
                    <svg class="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span class="text-red-300 text-sm">
                      ¿Eliminar <strong>{{ p.name }}</strong>? Esta acción no se puede deshacer.
                    </span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button (click)="confirmDeleteId.set(null)"
                      class="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                      Cancelar
                    </button>
                    <button (click)="deleteProject(p)" [disabled]="deletingId() === p.id"
                      class="text-xs text-white px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500
                             disabled:opacity-50 transition-colors">
                      {{ deletingId() === p.id ? 'Eliminando...' : 'Sí, eliminar' }}
                    </button>
                  </div>
                </div>

              } @else {
                <!-- Normal project row -->
                <div class="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4
                            flex items-center justify-between gap-4 hover:border-gray-700 transition-colors">
                  <div class="flex items-center gap-4 min-w-0">
                    <div class="w-9 h-9 rounded-lg bg-indigo-600/15 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-white font-medium text-sm truncate">{{ p.name }}</p>
                      @if (p.description) {
                        <p class="text-gray-400 text-xs mt-0.5 truncate">{{ p.description }}</p>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <p class="text-gray-500 text-xs hidden sm:block">{{ formatDate(p.created_at) }}</p>

                    @if (auth.canWrite()) {
                      <button (click)="openEdit(p)" title="Editar"
                        class="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10
                               rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                               m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    }

                    @if (isAdmin()) {
                      <button (click)="confirmDeleteId.set(p.id)" title="Eliminar"
                        class="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10
                               rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6
                               m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    }
                  </div>
                </div>
              }
            }
          </div>
        }
      </main>
    </div>

    @if (showModal()) {
      <app-create-project-modal
        [project]="editingProject()"
        (close)="closeModal()"
        (saved)="onSaved($event)" />
    }

    @if (showManager() && auth.currentWorkspace()) {
      <app-workspace-manager-modal
        [workspace]="auth.currentWorkspace()!"
        (close)="showManager.set(false)"
        (deleted)="onWorkspaceDeleted()" />
    }
  `,
})
export class ProjectsComponent implements OnInit {
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly showModal = signal(false);
  readonly editingProject = signal<Project | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly showManager = signal(false);

  constructor(
    readonly auth: AuthService,
    private readonly projectService: ProjectService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.projectService.list().subscribe({
      next: (data) => { this.projects.set(data); this.loading.set(false); },
      error: (err) => { this.error.set(extractErrorMessage(err)); this.loading.set(false); },
    });
  }

  isAdmin(): boolean {
    return this.auth.currentWorkspace()?.role === 'admin';
  }

  openCreate(): void {
    this.editingProject.set(null);
    this.showModal.set(true);
  }

  openEdit(project: Project): void {
    this.editingProject.set(project);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProject.set(null);
  }

  onSaved(project: Project): void {
    if (this.editingProject()) {
      this.projects.update((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    } else {
      this.projects.update((prev) => [project, ...prev]);
    }
  }

  deleteProject(project: Project): void {
    this.deletingId.set(project.id);
    this.projectService.delete(project.id).subscribe({
      next: () => {
        this.projects.update((prev) => prev.filter((p) => p.id !== project.id));
        this.confirmDeleteId.set(null);
        this.deletingId.set(null);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err));
        this.confirmDeleteId.set(null);
        this.deletingId.set(null);
      },
    });
  }

  onWorkspaceDeleted(): void {
    const wsId = this.auth.currentWorkspace()?.id;
    if (wsId) this.auth.removeWorkspaceFromList(wsId);
    this.router.navigate(['/workspaces']);
  }

  roleLabel(role: string | undefined): string {
    return role ? (ROLE_LABELS[role] ?? '') : '';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  changeWorkspace(): void { this.router.navigate(['/workspaces']); }
  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }
}

import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-950 flex flex-col">

      <!-- Topbar -->
      <header class="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div class="max-w-2xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button (click)="goBack()"
              class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-white font-semibold text-sm">Configuración de cuenta</h1>
          </div>
          <span class="text-gray-400 text-sm hidden sm:block">{{ auth.user()?.email }}</span>
        </div>
      </header>

      <!-- Main -->
      <main class="flex-1 max-w-2xl mx-auto w-full px-6 py-8 space-y-6">

        <!-- Profile card -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 class="text-white font-semibold mb-4">Perfil</h2>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
              <span class="text-indigo-400 font-bold text-lg">
                {{ (auth.user()?.full_name ?? '?')[0].toUpperCase() }}
              </span>
            </div>
            <div>
              <p class="text-white font-medium text-sm">{{ auth.user()?.full_name }}</p>
              <p class="text-gray-400 text-xs mt-0.5">{{ auth.user()?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Change password card -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 class="text-white font-semibold mb-4">Cambiar contraseña</h2>

          @if (pwSuccess()) {
            <div class="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-2.5 mb-4">
              Contraseña actualizada correctamente.
            </div>
          }

          @if (pwError()) {
            <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ pwError() }}
            </div>
          }

          <form [formGroup]="pwForm" (ngSubmit)="changePassword()" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-300">Contraseña actual <span class="text-red-400">*</span></label>
              <input formControlName="current_password" type="password" placeholder="••••••••"
                class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-300">Nueva contraseña <span class="text-red-400">*</span></label>
              <input formControlName="new_password" type="password" placeholder="Mínimo 8 caracteres"
                class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
            </div>
            <div class="flex justify-end">
              <button type="submit" [disabled]="pwLoading() || pwForm.invalid"
                class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors">
                {{ pwLoading() ? 'Guardando...' : 'Guardar contraseña' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Danger zone -->
        <div class="bg-gray-900 border border-red-500/20 rounded-2xl p-6">
          <h2 class="text-white font-semibold mb-1">Cerrar sesión</h2>
          <p class="text-gray-400 text-sm mb-4">Finaliza tu sesión en este dispositivo.</p>
          <button (click)="logout()"
            class="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30
                   font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            Cerrar sesión
          </button>
        </div>
      </main>
    </div>
  `,
})
export class SettingsComponent {
  readonly pwForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly pwLoading = signal(false);
  readonly pwError = signal('');
  readonly pwSuccess = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    readonly auth: AuthService,
    private readonly userService: UserService,
    private readonly router: Router,
  ) {}

  changePassword(): void {
    if (this.pwForm.invalid) return;
    const { current_password, new_password } = this.pwForm.getRawValue();
    this.pwLoading.set(true);
    this.pwError.set('');
    this.pwSuccess.set(false);

    this.userService.changePassword(current_password, new_password).subscribe({
      next: () => {
        this.pwSuccess.set(true);
        this.pwLoading.set(false);
        this.pwForm.reset();
      },
      error: (err) => {
        this.pwError.set(extractErrorMessage(err));
        this.pwLoading.set(false);
      },
    });
  }

  goBack(): void {
    if (this.auth.hasAccessToken()) {
      this.router.navigate(['/projects']);
    } else {
      this.router.navigate(['/workspaces']);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

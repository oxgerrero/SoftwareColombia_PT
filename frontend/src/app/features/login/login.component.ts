import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white">ProjectSpace</h1>
          <p class="text-gray-400 text-sm mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <!-- Card -->
        <form [formGroup]="form" (ngSubmit)="submit()"
          class="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-5">

          @if (error()) {
            <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {{ error() }}
            </div>
          }

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-300">Email</label>
            <input type="email" formControlName="email" placeholder="correo@ejemplo.com"
              class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-300">Contraseña</label>
            <input type="password" formControlName="password" placeholder="••••••••"
              class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
          </div>

          <button type="submit" [disabled]="loading() || form.invalid"
            class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-400 mt-5">
          ¿No tienes cuenta?
          <a routerLink="/register" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors ml-1">
            Regístrate
          </a>
        </p>
        <p class="text-center text-xs text-gray-600 mt-2">
          Demo: admin&#64;demo.com / password123
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly form = this.fb.nonNullable.group({
    email: ['admin@demo.com', [Validators.required, Validators.email]],
    password: ['password123', Validators.required],
  });

  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      this.router.navigate(['/workspaces']);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}

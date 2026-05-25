import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white">Crear cuenta</h1>
          <p class="text-gray-400 text-sm mt-1">Empieza a gestionar tus proyectos</p>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">

          @if (success()) {
            <div class="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
              Cuenta creada correctamente. <a routerLink="/login" class="underline font-medium">Inicia sesión</a>
            </div>
          }

          @if (error()) {
            <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-300">Nombre completo <span class="text-red-400">*</span></label>
              <input formControlName="full_name" type="text" placeholder="Tu nombre"
                class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-300">Correo electrónico <span class="text-red-400">*</span></label>
              <input formControlName="email" type="email" placeholder="tu@email.com"
                class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-gray-300">Contraseña <span class="text-red-400">*</span></label>
              <input formControlName="password" type="password" placeholder="Mínimo 8 caracteres"
                class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
            </div>

            <button type="submit" [disabled]="loading() || form.invalid || success()"
              class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold rounded-lg py-2.5 text-sm transition-colors mt-2">
              {{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}
            </button>
          </form>

          <p class="text-center text-sm text-gray-400 mt-5">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors ml-1">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  readonly form = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    const { full_name, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');

    this.userService.register(email, password, full_name).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}

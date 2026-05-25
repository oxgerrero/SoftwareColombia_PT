import { Routes } from '@angular/router';
import { accessTokenGuard, anyTokenGuard, selectionTokenGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'workspaces',
    canActivate: [selectionTokenGuard],
    loadComponent: () =>
      import('./features/workspace-selector/workspace-selector.component').then(
        (m) => m.WorkspaceSelectorComponent,
      ),
  },
  {
    path: 'projects',
    canActivate: [accessTokenGuard],
    loadComponent: () =>
      import('./features/projects/projects.component').then((m) => m.ProjectsComponent),
  },
  {
    path: 'settings',
    canActivate: [anyTokenGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'login' },
];

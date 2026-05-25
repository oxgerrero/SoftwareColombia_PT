import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const selectionTokenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.hasSelectionToken() || router.createUrlTree(['/login']);
};

export const accessTokenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.hasAccessToken() || router.createUrlTree(['/login']);
};

export const anyTokenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.hasAnyToken() || router.createUrlTree(['/login']);
};

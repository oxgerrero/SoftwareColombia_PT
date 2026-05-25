import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginResponse, TokenResponse, User, WorkspaceAccess, WorkspaceOut } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _workspaces = signal<WorkspaceAccess[]>([]);
  private readonly _selectionToken = signal<string | null>(null);
  private readonly _currentWorkspace = signal<WorkspaceAccess | null>(null);

  readonly user = this._user.asReadonly();
  readonly workspaces = this._workspaces.asReadonly();
  readonly selectionToken = this._selectionToken.asReadonly();
  readonly currentWorkspace = this._currentWorkspace.asReadonly();

  readonly canWrite = computed(() => {
    const role = this._currentWorkspace()?.role;
    return role === 'admin' || role === 'editor';
  });

  constructor(private http: HttpClient) {}

  async login(email: string, password: string): Promise<void> {
    const data = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { email, password }),
    );
    sessionStorage.removeItem('access_token');
    this._user.set(data.user);
    this._workspaces.set(data.workspaces);
    this._selectionToken.set(data.selection_token);
    this._currentWorkspace.set(null);
  }

  async selectWorkspace(workspaceId: string): Promise<void> {
    const token = this._selectionToken();
    const data = await firstValueFrom(
      this.http.post<TokenResponse>(
        `${environment.apiUrl}/api/auth/token`,
        { workspace_id: workspaceId },
        { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
      ),
    );
    sessionStorage.setItem('access_token', data.access_token);
    this._currentWorkspace.set(data.workspace);
  }

  addWorkspaceToList(ws: WorkspaceOut): void {
    const entry: WorkspaceAccess = {
      id: ws.id,
      name: ws.name,
      description: ws.description,
      role: 'admin',
    };
    this._workspaces.update((prev) => [entry, ...prev]);
  }

  updateWorkspaceInList(ws: WorkspaceOut): void {
    this._workspaces.update((prev) =>
      prev.map((w) =>
        w.id === ws.id ? { ...w, name: ws.name, description: ws.description } : w,
      ),
    );
    this._currentWorkspace.update((cur) =>
      cur?.id === ws.id ? { ...cur, name: ws.name, description: ws.description } : cur,
    );
  }

  removeWorkspaceFromList(workspaceId: string): void {
    this._workspaces.update((prev) => prev.filter((w) => w.id !== workspaceId));
    if (this._currentWorkspace()?.id === workspaceId) {
      this._currentWorkspace.set(null);
      sessionStorage.removeItem('access_token');
    }
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  hasSelectionToken(): boolean {
    return !!this._selectionToken();
  }

  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }

  hasAnyToken(): boolean {
    return this.hasSelectionToken() || this.hasAccessToken();
  }

  logout(): void {
    sessionStorage.removeItem('access_token');
    this._user.set(null);
    this._workspaces.set([]);
    this._selectionToken.set(null);
    this._currentWorkspace.set(null);
  }
}

export type Role = 'admin' | 'editor' | 'reader';

export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface WorkspaceAccess {
  id: string;
  name: string;
  description: string | null;
  role: Role;
}

export interface LoginResponse {
  user: User;
  workspaces: WorkspaceAccess[];
  selection_token: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  workspace: WorkspaceAccess;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  workspace_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  user_id: string;
  email: string;
  full_name: string;
  role: Role;
}

export interface WorkspaceOut {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

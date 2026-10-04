export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  passwordHash: string;
  active: boolean;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  name?: string | null;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  user: PublicUser;
  token: string;
  expiresAt: Date;
}

export interface AuthUserRepository {
  findByUsername(username: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
}

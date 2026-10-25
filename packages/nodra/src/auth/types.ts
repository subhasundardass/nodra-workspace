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
  ip?: string | null;
}

export interface LoginResult {
  user: PublicUser;
  token: string;
  expiresAt: Date;
}

export interface AuthUserRepository {
  findByUsername(username: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;

  updateLoginMetadata(
    id: string,
    lastLogin: Date,
    lastIp: string | null,
  ): Promise<void>;
}

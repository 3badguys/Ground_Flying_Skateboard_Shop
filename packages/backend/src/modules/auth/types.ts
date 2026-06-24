import { Role } from './roles';

export interface JwtPayload {
  sub: number;
  username: string | null;
  phone: string | null;
  role: Role;
}

export interface UserInfo {
  id: number;
  username: string | null;
  phone: string | null;
  role: Role;
  mustResetPassword: boolean;
  createdAt: Date;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

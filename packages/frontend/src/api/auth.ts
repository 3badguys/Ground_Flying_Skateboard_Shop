import request from './request'
import type { UserInfo } from '../utils/auth'

export interface LoginParams {
  username?: string
  phone?: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: UserInfo
}

export interface RefreshResult {
  accessToken: string
}

export interface CreateUserParams {
  username?: string
  phone?: string
  password: string
  role: string
}

export interface UpdateProfileParams {
  username?: string
  phone?: string
  password?: string
}

export interface UpdateUserParams extends UpdateProfileParams {
  role?: string
}

export function login(data: LoginParams): Promise<LoginResult> {
  return request.post('/auth/login', data)
}

export function refreshToken(): Promise<RefreshResult> {
  return request.post('/auth/refresh')
}

export function logout(): Promise<void> {
  return request.post('/auth/logout')
}

export function getProfile(): Promise<UserInfo> {
  return request.get('/auth/me')
}

export function updateProfile(data: UpdateProfileParams): Promise<UserInfo> {
  return request.put('/auth/me', data)
}

export function getMyStudents(): Promise<any[]> {
  return request.get('/auth/me/students')
}

export function getUsers(): Promise<UserInfo[]> {
  return request.get('/users')
}

export function createUser(data: CreateUserParams): Promise<UserInfo> {
  return request.post('/users', data)
}

export function updateUser(id: number, data: UpdateUserParams): Promise<UserInfo> {
  return request.put(`/users/${id}`, data)
}

export function deleteUser(id: number): Promise<void> {
  return request.delete(`/users/${id}`)
}

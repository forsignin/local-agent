import api from './api';
import type { User } from '../types/user';

export interface LoginCredentials {
  username: string;
  password: string;
  oauthToken?: string;
  provider?: string;
}

export interface RegisterData extends Omit<User, 'id' | 'created_at' | 'updated_at'> {
  password: string;
}

export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  const { access_token, user } = response.data;
  localStorage.setItem('token', access_token);
  return { token: access_token, user };
};

export const logout = async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('token');
};

export const register = async (data: RegisterData) => {
  const response = await api.post('/auth/register', data);
  const { user, access_token } = response.data;
  localStorage.setItem('token', access_token);
  return { user, token: access_token };
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

export const updateProfile = async (data: Partial<User>) => {
  const response = await api.put('/auth/profile', data);
  return response.data.user;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  await api.put('/auth/password', { oldPassword, newPassword });
};

export const refreshToken = async () => {
  const response = await api.post('/auth/refresh');
  const { access_token } = response.data;
  localStorage.setItem('token', access_token);
  return access_token;
};

export const forgotPassword = async (email: string) => {
  await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, newPassword: string) => {
  await api.post('/auth/reset-password', { token, newPassword });
};
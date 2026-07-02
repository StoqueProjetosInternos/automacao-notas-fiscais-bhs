import axios from 'axios';
import type { Note, NoteData } from '../types';

// Utilitários de manipulação de Cookies no Navegador
export const setCookie = (name: string, value: string, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

export const getCookie = (name: string): string => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return '';
};

export const eraseCookie = (name: string) => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor para injetar dinamicamente o token em todas as chamadas de API
apiClient.interceptors.request.use((config) => {
  const token = getCookie('stoque_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const fetchNotes = async (): Promise<Note[]> => {
  const response = await apiClient.get<Note[]>('/api/notes');
  return response.data;
};

export const updateNote = async (id: string, data: NoteData): Promise<void> => {
  await apiClient.post(`/api/notes/${id}`, data);
};

export const reprocessNotes = async (id: string): Promise<any> => {
  const response = await apiClient.post(`/api/notes/reprocess/${id}`);
  return response.data;
};

export const getFileUrl = (fileName: string): string => {
  return `${API_URL}/files/${fileName}`;
};

export interface UsageLog {
  id: number;
  dataHora: string;
  arquivo: string;
  modeloIa: string;
  fornecedor: string;
  tokensEntrada: number;
  tokensSaida: number;
  custoUsd: number;
  tempoProcessamentoMs: string;
  zeevId?: string;
  cnpjFornecedor?: string;
  numeroDocumento?: string;
  valorFatura?: number;
  status?: string;
  statusArquivo?: string;
}

export const fetchUsageLog = async (): Promise<UsageLog[]> => {
  const response = await apiClient.get<UsageLog[]>('/api/notes/usage');
  return response.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/notes/${id}`);
};

export interface User {
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
  setCookie('stoque_auth_token', response.data.token);
  return response.data;
};

export const checkAuthSession = async (): Promise<{ user: User }> => {
  const response = await apiClient.get<{ user: User }>('/api/auth/me');
  return response.data;
};

export const logoutUser = () => {
  eraseCookie('stoque_auth_token');
};
import { get, post, put, del } from './api';
import type { Company, CompanyUser } from '../types';

export async function getCompanies(): Promise<Company[]> {
  const res = await get<Company[]>('/api/admin/companies');
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao buscar empresas');
  }
  return res.data;
}

export async function createCompany(data: Partial<Company>): Promise<Company> {
  const res = await post<Company>('/api/admin/companies', data);
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao criar empresa');
  }
  return res.data;
}

export async function updateCompany(id: number, data: Partial<Company>): Promise<Company> {
  const res = await put<Company>(`/api/admin/companies/${id}`, data);
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao atualizar empresa');
  }
  return res.data;
}

export async function deleteCompany(id: number): Promise<void> {
  const res = await del<void>(`/api/admin/companies/${id}`);
  if (!res.ok) {
    throw new Error(res.message || 'Erro ao excluir empresa');
  }
}

export async function getCompanyUsers(companyId: number): Promise<CompanyUser[]> {
  const res = await get<CompanyUser[]>(`/api/admin/companies/${companyId}/users`);
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao buscar usuários');
  }
  return res.data;
}

export async function createCompanyUser(companyId: number, data: Partial<CompanyUser>): Promise<CompanyUser> {
  const res = await post<CompanyUser>(`/api/admin/companies/${companyId}/users`, data);
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao criar usuário');
  }
  return res.data;
}

export async function updateCompanyUser(companyId: number, userId: number, data: Partial<CompanyUser>): Promise<CompanyUser> {
  const res = await put<CompanyUser>(`/api/admin/companies/${companyId}/users/${userId}`, data);
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao atualizar usuário');
  }
  return res.data;
}

export async function deleteCompanyUser(companyId: number, userId: number): Promise<void> {
  const res = await del<void>(`/api/admin/companies/${companyId}/users/${userId}`);
  if (!res.ok) {
    throw new Error(res.message || 'Erro ao excluir usuário');
  }
}

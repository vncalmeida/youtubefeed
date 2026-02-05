import { CompanyRepository } from '../repositories/companies.js';
import { Company, CompanyCreateInput, CompanyUser, CompanyUserCreateInput } from '../types/company.js';

export class CompanyService {
  private repo: CompanyRepository;

  constructor(repo = new CompanyRepository()) {
    this.repo = repo;
  }

  listCompanies(): Promise<Company[]> {
    return this.repo.findAll();
  }

  createCompany(input: CompanyCreateInput): Promise<Company> {
    return this.repo.create(input);
  }

  updateCompany(id: number, input: CompanyCreateInput): Promise<Company> {
    return this.repo.update(id, input);
  }

  removeCompany(id: number): Promise<void> {
    return this.repo.delete(id);
  }

  listUsers(companyId: number): Promise<CompanyUser[]> {
    return this.repo.findUsers(companyId);
  }

  addUser(companyId: number, input: CompanyUserCreateInput): Promise<CompanyUser> {
    return this.repo.createUser(companyId, input);
  }

  updateUser(companyId: number, userId: number, input: CompanyUserCreateInput): Promise<CompanyUser> {
    return this.repo.updateUser(companyId, userId, input);
  }

  removeUser(companyId: number, userId: number): Promise<void> {
    return this.repo.deleteUser(companyId, userId);
  }
}

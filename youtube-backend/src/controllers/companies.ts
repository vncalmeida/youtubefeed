import { Request, Response } from 'express';
import { CompanyService } from '../services/companies.js';

export class CompanyController {
  private service = new CompanyService();

  list = async (_req: Request, res: Response) => {
    const companies = await this.service.listCompanies();
    res.json(companies);
  };

  create = async (req: Request, res: Response) => {
    const { name, plan, isActive, mrr, planExpiresAt } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const company = await this.service.createCompany({
      name,
      plan,
      isActive: !!isActive,
      mrr: Number(mrr) || 0,
      planExpiresAt: planExpiresAt || null,
    });
    res.status(201).json(company);
  };

  update = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, plan, isActive, mrr, planExpiresAt } = req.body;
    const company = await this.service.updateCompany(id, {
      name,
      plan,
      isActive: !!isActive,
      mrr: Number(mrr) || 0,
      planExpiresAt: planExpiresAt || null,
    });
    res.json(company);
  };

  delete = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await this.service.removeCompany(id);
    res.status(204).end();
  };

  listUsers = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id);
    const users = await this.service.listUsers(companyId);
    res.json(users);
  };

  createUser = async (req: Request, res: Response) => {
    const companyId = Number(req.params.id);
    const { name, email, role, isActive } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const user = await this.service.addUser(companyId, {
      name,
      email,
      role,
      isActive: !!isActive,
    });
    res.status(201).json(user);
  };

  updateUser = async (req: Request, res: Response) => {
    const companyId = Number(req.params.companyId);
    const userId = Number(req.params.userId);
    const { name, email, role, isActive } = req.body;
    const user = await this.service.updateUser(companyId, userId, {
      name,
      email,
      role,
      isActive: !!isActive,
    });
    res.json(user);
  };

  deleteUser = async (req: Request, res: Response) => {
    const companyId = Number(req.params.companyId);
    const userId = Number(req.params.userId);
    await this.service.removeUser(companyId, userId);
    res.status(204).end();
  };
}

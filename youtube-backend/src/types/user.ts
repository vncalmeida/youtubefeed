export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  companyId: number;
}

export interface UserCreateInput {
  name: string;
  email: string;
  passwordHash: string;
}

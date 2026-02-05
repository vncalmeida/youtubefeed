import bcrypt from 'bcryptjs';
import { init, pool } from '../db.js';
import { AdminUserRepository } from '../repositories/adminUsers.js';

function getArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : null;
}

async function main() {
  const name = getArg('--name');
  const email = getArg('--email');
  const password = getArg('--password');

  if (!name || !email || !password) {
    console.error('Usage: npm run create-admin -- --name <name> --email <email> --password <password>');
    process.exit(1);
  }

  await init();
  const repo = new AdminUserRepository();

  const existing = await repo.findByEmail(email);
  if (existing) {
    console.error('Admin user with this email already exists');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await repo.create({ name, email, passwordHash });
  console.log('Admin user created with id:', admin.id);
  await pool.end();
}

main().catch((err) => {
  console.error('Failed to create admin user', err);
  process.exit(1);
});

import { Router } from 'express';
import { AdminAuthController } from '../controllers/adminAuth.js';

const router = Router();
const controller = new AdminAuthController();

router.post('/login', controller.login);

export default router;

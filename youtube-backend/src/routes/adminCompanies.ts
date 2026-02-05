import { Router } from 'express';
import { CompanyController } from '../controllers/companies.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminAuth);
const controller = new CompanyController();

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

router.get('/:id/users', controller.listUsers);
router.post('/:id/users', controller.createUser);
router.put('/:companyId/users/:userId', controller.updateUser);
router.delete('/:companyId/users/:userId', controller.deleteUser);

export default router;

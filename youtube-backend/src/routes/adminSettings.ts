import { Router } from 'express';
import { SettingsController } from '../controllers/settings.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminAuth);
const controller = new SettingsController();

router.get('/', controller.getAll);
router.put('/plans', controller.savePlans);
router.put('/smtp', controller.saveSmtp);
router.post('/smtp/test', controller.testSmtp);
router.put('/mp', controller.saveMp);

export default router;

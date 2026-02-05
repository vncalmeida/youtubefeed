import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminAuth);
const controller = new MetricsController();

router.get('/summary', controller.summary);
router.get('/revenue-by-plan', controller.revenueByPlan);
router.get('/revenue-trend', controller.revenueTrend);

export default router;

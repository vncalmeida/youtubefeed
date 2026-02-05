import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.js';

const router = Router();
const controller = new PaymentsController();

router.post('/pix', controller.createPix);
router.post('/subscribe', controller.subscribe);
router.get('/:id/stream', controller.stream);
router.get('/:id', controller.status);
router.post('/webhook', controller.webhook);

export default router;

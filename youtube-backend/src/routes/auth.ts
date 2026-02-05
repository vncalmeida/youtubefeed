import { Router } from 'express';
import { AuthController } from '../controllers/auth.js';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/password/reset/request', controller.requestReset);
router.post('/password/reset/verify', controller.verifyReset);
router.post('/password/reset/confirm', controller.confirmReset);
router.post('/register-after-payment', controller.registerAfterPayment);

export default router;

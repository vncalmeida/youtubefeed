import { Router } from 'express';
import { ChannelController } from '../controllers/channels.js';

const router = Router();
const controller = new ChannelController();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id/videos', controller.videos);
router.delete('/:id', controller.delete);

export default router;

import { Router } from 'express';
import { identifyController } from '../controllers/identifyController';
import { validateIdentifyRequest } from '../middleware/validation';

const router = Router();

router.post('/identify', validateIdentifyRequest, identifyController);

export default router;
import express from 'express';
import { sendContactMessage } from '../controllers/contactController';

const router = express.Router();

// Public route - no authentication required
router.post('/send', sendContactMessage);

export default router;

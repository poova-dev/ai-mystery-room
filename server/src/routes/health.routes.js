import { Router } from 'express';

const router = Router();

// GET /api/health - Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;

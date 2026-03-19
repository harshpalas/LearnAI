import express from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;

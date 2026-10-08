import { Router } from 'express';
import { dbStatus } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = dbStatus();
  res.status(db === 'connected' ? 200 : 503).json({
    status: db === 'connected' ? 'ok' : 'degraded',
    database: db,
    time: new Date().toISOString(),
  });
});

export default router;

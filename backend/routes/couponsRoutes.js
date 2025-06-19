import { Router } from 'express';
import couponsPackages from '../models/couponsPackages.js';
const router = Router();

router.get('/api/coupons', (req, res) => {
  res.json(couponsPackages);
});

export default router;

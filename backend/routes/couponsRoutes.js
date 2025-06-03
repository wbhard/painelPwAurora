const express = require('express');
const router = express.Router();
const couponsPackages = require('../models/couponsPackages');

router.get('/api/coupons', (req, res) => {
  res.json(couponsPackages);
});

module.exports = router;

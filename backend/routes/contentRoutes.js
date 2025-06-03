const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// ========================= ROTAS DE CONTEÚDO (content) =========================
// Painel Home
// Rota principal completa para painel-home
router.get('/painel-home', (req, res) => {
  res.render('painel-home'); // Renderiza a página completa
});


// Donate
const cashPackages = require('../models/cashPackages');
const paymentMethods = require('../models/paymentMethods');
router.get('/donate/content', (req, res) => {
  res.render('donate', { layout: false, cashPackages, paymentMethods });
});

// Minhas Doações
router.get('/minhas-doacoes/content', (req, res) => {
  res.render('minhas-doacoes', { layout: false });
});

// Metas de Doação
router.get('/metas-doacao/content', (req, res) => {
  res.render('metas-doacao', { layout: false });
});

// Dashboard
router.get('/dashboard/content', (req, res) => {
  res.render('dashboard', { layout: false });
});

module.exports = router;
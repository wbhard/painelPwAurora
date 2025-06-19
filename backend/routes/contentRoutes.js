import express from 'express';
import cashPackages from '../models/cashPackages.js';
import paymentMethods from '../models/paymentMethods.js';
const router = express.Router();

// ========================= ROTAS DE CONTEÚDO (content) =========================
// Painel Home
// Rota principal completa para painel-home
router.get('/painel-home', (req, res) => {
  res.render('painel-home',{ userName: req.session.userName }); // Renderiza a página completa
});

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


//lista dos personagens
import {getUserRolesSync} from '../controllers/getUserRoles.js';
import {getRoleData} from '../controllers/getRoleData.js';
import className from '../utils/constants/class.js';


router.get('/list-of-characters/content', async (req, res) => {
  try {
    const userId = req.session.userId
    const personagensList = await getUserRolesSync(userId);
    console.log("Personagens encontrados:", personagensList);
    
    const personagens = [];

    for (const p of personagensList) {
      const data = await getRoleData(p.roleId);
      personagens.push({
        nome: data.base.name,
        classe: className[data.base.cls] || `Classe ${data.base.cls}`,
        level: data.status.nivel,
        cultivo: data.status.cultivo,
        experiencia: data.status.exp
      });
    }

    res.render('list-of-characters', { layout: false, personagens });

  } catch (err) {
    console.error("Erro ao carregar personagens:", err);
    res.render('list-of-characters', { layout: false, personagens: [] });
  }
});

export default router;
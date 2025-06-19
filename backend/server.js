import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
// import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { QrCodePix } from 'qrcode-pix';

//Routes
import contentRoutes from './routes/contentRoutes.js';
import authenticationRoutes from './routes/authenticationRoutes.js';
import couponRoutes from './routes/couponsRoutes.js';
import mercadopagoRoutes from './routes/mercadopagoRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';


// ⬇️ Substitui __dirname em ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⬇️ Carrega variáveis do .env
dotenv.config();

// Função principal que inicia Vite e depois Express
async function startServer() {
  const app = express();

  app.use(express.static(path.join(__dirname, '../public')));

  // Middlewares
  app.use(cors());
  //app.use(express.static('public'));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // View engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));


  // Sessões
  app.use(session({
    secret: 'segredo123',
    resave: false,
    saveUninitialized: false,
  }));

  app.use('/', authenticationRoutes);
  app.use('/', contentRoutes);
  app.use('/', couponRoutes);
  app.use('/api', mercadopagoRoutes);
  app.use('/api', webhookRoutes);

  // Página inicial
  app.get('/', (req, res) => {
    res.render('index'); // deve renderizar views/login.ejs
  });


  // Rota: geração QR Code PIX
  const pixKey = "17296049782";
  const merchantName = "Daniel da Silva Gomes Neto";
  const merchantCity = "RIODEJANEIRO";
  const description = "Doação via site";

  app.get("/api/pix-qr", async (req, res) => {
    const amount = req.query.amount;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    try {
      const qrCodePix = QrCodePix({
        version: '01',
        key: pixKey,
        name: merchantName,
        city: merchantCity,
        transactionId: Date.now().toString(),
        message: description,
        value: parseFloat(amount),
      });

      const payload = qrCodePix.payload();
      const base64 = await qrCodePix.base64();
      res.json({ payload, qrCodeBase64: base64 });
    } catch (error) {
      console.error("❌ Erro ao gerar QR:", error.message);
      res.status(500).json({ error: "Erro ao gerar QR" });
    }
  });

  // Pós-pagamento Mercado Pago
  app.get('/success', (req, res) => res.send('✅ Pagamento aprovado!'));
  app.get('/failure', (req, res) => res.send('❌ Pagamento falhou!'));
  app.get('/pending', (req, res) => res.send('⏳ Pagamento pendente.'));

  // Exemplo: renderização de personagens
  app.get('/list-of-character', async (req, res) => {
    const buffers = await getCharacterBuffers(req.session.userId); // seu método
    const personagens = buffers.map(buffer => {
      const data = parseRoleData8003(buffer);
      return {
        nome: data.base.name,
        classe: data.base.cls,
        level: data.status.nivel,
        cultivo: data.status.cultivo,
        experiencia: data.status.exp
      };
    });

    res.render('dashboard', { personagens });
  });

  // Inicializa servidor
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

// Inicia o servidor
startServer();

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');  // Banco existente (login/cadastro)
const cors = require("cors");
const path = require('path');
const { QrCodePix } = require('qrcode-pix');

// Configuração e conexão com GameDB
const GameDBClient = require('./gamedb-client');
const gameDBClient = new GameDBClient('192.168.0.112', 29400);

let connected = false;
async function connectToGameDB() {
  try {
    await gameDBClient.connect();
    connected = true;
    console.log('✅ Conectado ao gamedbd');
  } catch (err) {
    console.error('❌ Falha ao conectar ao gamedbd:', err);
    // setTimeout(connectToGameDB, 5000);
  }
}
connectToGameDB();

// Inicialização do app Express
const app = express();
app.use(cors());
app.use(express.static('javascript'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Configuração de sessões
app.use(session({
  secret: 'segredo123',
  resave: false,
  saveUninitialized: false
}));

// Importação e uso de rotas
const contentRoutes = require('./routes/contentRoutes');
const authenticationRoutes = require('./routes/AuthenticationRoutes');
const couponRoutes = require('./routes/couponsRoutes');
const mercadopagoRoutes = require('./routes/mercadopagoRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

app.use('/', authenticationRoutes);
app.use('/', contentRoutes);
app.use('/', couponRoutes);
app.use('/api', mercadopagoRoutes);
app.use('/api', webhookRoutes);

// Rota antiga do QrCodePix (local)
const pixKey = "17296049782";
const merchantName = "Daniel da Silva Gomes Neto";
const merchantCity = "RIODEJANEIRO";
const description = "Doação via site";

app.get("/api/pix-qr", async (req, res) => {
  const amount = req.query.amount;
  console.log("Amount:", amount);
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
    console.error("❌ Erro ao gerar QR local:", error.message);
    res.status(500).json({ error: "Erro ao gerar QR" });
  }
});

// Rotas de retorno do Mercado Pago
app.get('/success', (req, res) => res.send('✅ Pagamento aprovado!'));
app.get('/failure', (req, res) => res.send('❌ Pagamento falhou!'));
app.get('/pending', (req, res) => res.send('⏳ Pagamento pendente.'));

// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Order } = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,  // Use sua variável do .env
    options: { timeout: 5000 },
});

router.get('/pix-qr', async (req, res) => {
    const amount = parseFloat(req.query.amount);
    const userId = req.query.userId || 'defaultUser';
    const payerEmail = req.query.email || 'emaildo@cliente.com.br';  // Pode vir do frontend ou do usuário logado
    console.error('Gerando Pix Mercado Pago:');

    if (!amount) return res.status(400).json({ error: 'Amount is required' });

    const order = new Order(client);

    const body = {
        type: "online",
        processing_mode: "automatic",
        total_amount: amount,
        external_reference: `doacao_${userId}_${Date.now()}`,
        payer: { email: payerEmail },
        transactions: {
            payments: [
                {
                    amount: amount,
                    payment_method: { type: "pix" },
                },
            ],
        },
    };

    try {
        const response = await order.create({ body });
        const pixData = response.transactions.payments[0].point_of_interaction.transaction_data;
        res.json({
            qrCodeBase64: pixData.qr_code_base64,
            qrCodeText: pixData.qr_code,
            txid: pixData.transaction_id,
            valor: amount,
        });
    } catch (err) {
        console.error('Erro ao gerar Pix Mercado Pago:', err);
        res.status(500).json({ error: 'Erro ao gerar QR Pix Mercado Pago' });
    }
});

module.exports = router;

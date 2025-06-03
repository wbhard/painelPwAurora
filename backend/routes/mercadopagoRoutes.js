const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

router.post('/mercadopago-checkout', async (req, res) => {
    const { amount, goldAmount, paymentMethod } = req.body;  // Recebe o método de pagamento do frontend (ex: 'pix', 'credit_card')

    try {
        const preference = new Preference(client);
        console.log('Dados da preferência:', {
            items: [
                {
                    title: `Doação - ${goldAmount} Gold`,
                    unit_price: Number(amount),
                    quantity: 1
                }
            ]
        });

        const paymentMethods = {
            excluded_payment_types: [],
            default_payment_method_id: paymentMethod || undefined
        };

        // Se for Pix, exclui cartão e boleto para forçar Pix
        if (paymentMethod === 'pix') {
            paymentMethods.excluded_payment_types = [
                { id: "credit_card" },
                { id: "ticket" }
            ];
            paymentMethods.default_payment_method_id = "pix";
        }

        const response = await preference.create({
            body: {
                items: [
                    {
                        title: `Doação - ${goldAmount} Gold`,
                        unit_price: Number(amount),
                        quantity: 1
                    }
                ],
                payment_methods: paymentMethods,
                back_urls: {
                    success: 'https://www.google.com/',
                    failure: 'http://localhost:3000/painel-home',
                    pending: 'https://www.google.com/'
                },
                auto_return: 'approved',
                external_reference: `${Date.now()}-${Math.floor(Math.random() * 1000)}`
            }
        });

        res.status(200).json({
            init_point: response.sandbox_init_point || response.init_point
        });
    } catch (error) {
        console.error('Erro ao criar a preferência Mercado Pago:', error);
        res.status(500).json({ error: error.message || 'Erro interno ao criar a preferência' });
    }
});

module.exports = router;

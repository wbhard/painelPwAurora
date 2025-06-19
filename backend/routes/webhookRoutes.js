import { Router } from 'express';
import { MercadoPagoConfig, Payment } from 'mercadopago';
const router = Router();
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Webhook único para todas as notificações do Mercado Pago
router.post('/mercadopago/webhook', async (req, res) => {
    console.log('🔔 Webhook recebido:', req.body);
    const { type, data } = req.body;

    if (type !== 'payment') {
        return res.status(200).send('Evento não tratado');
    }

    try {
        const paymentId = data.id;
        const payment = new Payment(client);
        const paymentInfo = await payment.get(paymentId);

        const status = paymentInfo.status;  // approved, rejected, pending
        const externalRef = paymentInfo.external_reference;  // Identificador único do pedido
        const amount = paymentInfo.transaction_amount;
        const method = paymentInfo.payment_method_id;
        const tipoPagamento = paymentInfo.payment_type_id;  // Ex: pix, credit_card, ticket
        const email = paymentInfo.payer?.email;

        console.log(`🔔 Pagamento ${paymentId} (${externalRef}) via ${tipoPagamento}/${method}: ${status} - R$${amount}`);

        // Aqui você atualiza o status do pagamento no banco com base no external_reference
        // Exemplo: await updatePaymentStatus(externalRef, { status, paymentId, tipoPagamento, amount });

        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        res.status(500).send('Erro interno');
    }
});

export default router;

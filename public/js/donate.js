let selectedPackageAmount = 0;
let selectedPackageGoldPix = 0;
let couponsPackages = [];

// Fetch cupons na inicialização
fetchCoupons();

async function fetchCoupons() {
    try {
        const response = await fetch('/api/coupons');
        couponsPackages = await response.json();
        console.log('Coupons fetched:', couponsPackages);
    } catch (err) {
        console.error('Erro ao buscar cupons:', err);
    }
}

function initializeDonateFeatures() {
    const packages = document.querySelectorAll('.package');
    const paymentSelect = document.getElementById('payment-platform');
    const selectedPackageBonus = document.getElementById('selected-bonus-payment');
    const coupon1 = document.getElementById('coupon1');
    const coupon2 = document.getElementById('coupon2');
    const detailCoupon1 = document.getElementById('detail-coupon1');
    const detailCoupon2 = document.getElementById('detail-coupon2');

    if (!paymentSelect) {
        console.warn('Elementos não encontrados. Aguardando DOM...');
        requestAnimationFrame(initializeDonateFeatures);
        return;
    }

    // Eventos
    document.querySelector('.btn-cupom').addEventListener('click', () => validateCoupon(coupon1, coupon2, detailCoupon1, detailCoupon2));
    document.getElementById('btn-finalize-donate').addEventListener('click', () => handleFinalizeDonate(paymentSelect.value));
    document.getElementById('btn-close-finalize').addEventListener('click', () => handleCloseFinalizeDonate());

    packages.forEach(pkg => {
        pkg.addEventListener('click', () => selectPackage(pkg, packages, paymentSelect, selectedPackageBonus, coupon1, coupon2));
    });

    paymentSelect.addEventListener('change', () => updatePayment(paymentSelect, selectedPackageBonus));

}

/*function createMessageContainer(container) {
    const message = document.createElement('p');
    message.style.color = 'red';
    message.style.marginTop = '10px';
    container.insertAdjacentElement('beforebegin', message);
    return message;
}*/

function selectPackage(pkg, packages, paymentSelect, bonusEl, coupon1, coupon2) {
    packages.forEach(p => p.classList.remove('active'));
    pkg.classList.add('active');

    selectedPackageAmount = parseFloat(pkg.dataset.price);
    selectedPackageGoldPix = parseFloat(pkg.dataset.cash);
    showToast(`paymentSelect: ${bonusEl.value}`);
    bonusEl.textContent = updateGoldBonusPayment(paymentSelect);

    coupon1.textContent = updateCouponApplied(coupon1, selectedPackageGoldPix);
    coupon2.textContent = updateCouponApplied(coupon2, selectedPackageGoldPix);
    updateTotalGold();
}

function updateGoldBonusPayment(paymentSelect){
    if (paymentSelect.value === 'pix') {
        return (selectedPackageGoldPix * 0.05);
    } else {
        return 0;
    }
}

function updateCouponApplied(couponEl, goldValue) {
    if (couponEl.dataset.id) {
        const found = couponsPackages.find(c => c.id == couponEl.dataset.id);
        if (found) {
            return (goldValue * (found.amount / 100));
        }
    }
    return 0;
}

function validateCoupon(coupon1, coupon2, detail1, detail2) {
    const input = document.querySelector('.input-cupom').value.trim().toUpperCase();
    const found = couponsPackages.find(c => c.bonus_code === input);
    if (!found) return alert('Cupom não encontrado.');
    if (found.activated !== 1) return alert('Cupom não ativado.');
    if (coupon1.dataset.id == found.id || coupon2.dataset.id == found.id) return alert('Cupom já usado.');

    const bonusGold = selectedPackageGoldPix * (found.amount / 100);
    if (!coupon1.dataset.id || coupon1.dataset.id === '0') {
        coupon1.textContent = `${Math.round(bonusGold)}`;
        coupon1.dataset.id = found.id;
        detail1.textContent = found.bonus_code;
        showToast(`Cupom ${found.bonus_code} aplicado!`);
    } else if (!coupon2.dataset.id || coupon2.dataset.id === '0') {
        coupon2.textContent = `${Math.round(bonusGold)}`;
        coupon2.dataset.id = found.id;
        detail2.textContent = found.bonus_code;
        showToast(`Cupom ${found.bonus_code} aplicado!`);
    } else {
        alert('Você já usou dois cupons.');
    }
    document.querySelector('.input-cupom').value = '';
    updateTotalGold();
}

function updatePayment(paymentSelect, bonusEl) {
    if (paymentSelect.value !== 'pix') {
        bonusEl.textContent = 0;   
    }else{
        bonusEl.textContent = updateGoldBonusPayment(paymentSelect);
    }
    updateTotalGold();
}

function updateTotalGold() {
    const totalEl = document.getElementById('selected-package-total-gold');
    const bonusEl = document.getElementById('selected-bonus-payment');
    const coupon1 = document.getElementById('coupon1');
    const coupon2 = document.getElementById('coupon2');

    const total = (selectedPackageGoldPix || 0)
                + (parseFloat(bonusEl.textContent) || 0)
                + (parseFloat(coupon1.textContent) || 0)
                + (parseFloat(coupon2.textContent) || 0);

    totalEl.textContent = Math.round(total);
}

function showToast(msg) {
    const toast = document.getElementById('toast-message');
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.opacity = 1;
    setTimeout(() => toast.style.opacity = 0, 2000);
    setTimeout(() => toast.style.display = 'none', 2500);
}

function getCurrentUserId() {
    // Pegue o ID do usuário logado de onde você preferir (ex: session, hidden input, localStorage)
    return document.getElementById('user-id')?.value || 'defaultUser';
}

function getCurrentUserEmail() {
    // Pegue o email do usuário logado (ex: session, hidden input, localStorage)
    return document.getElementById('user-email')?.value || 'email@dominio.com';
}

async function handleFinalizeDonate(paymentMethod) {
    if (paymentMethod === 'mercadopago') {
        try {
            const response = await fetch('/api/mercadopago-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: selectedPackageAmount,
                    goldAmount: selectedPackageGoldPix
                })
            });
            const data = await response.json();
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                alert('Erro ao iniciar o checkout Mercado Pago.');
            }
        } catch (err) {
            console.error('Erro no checkout Mercado Pago:', err);
            alert('Erro ao processar o pagamento.');
        }
        return;
    }

    if (paymentMethod === 'pix') {
        try {
            const userId = getCurrentUserId();
            const response = await fetch('/api/mercadopago-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: selectedPackageAmount,
                    goldAmount: selectedPackageGoldPix,
                    paymentMethod: 'pix'  // Indica que o pagamento é via Pix
                })
            });
            const data = await response.json();
            if (data.init_point) {
                window.location.href = data.init_point;  // Redireciona para o checkout padrão do Mercado Pago (Pix)
            } else {
                alert('Erro ao iniciar o checkout Pix Mercado Pago.');
            }
        } catch (err) {
            console.error('Erro no checkout Pix Mercado Pago:', err);
            alert('Erro ao processar o pagamento Pix.');
        }
    }
}


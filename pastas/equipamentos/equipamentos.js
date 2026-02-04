let heroi = null;

// Elementos do DOM
const levelEl = document.getElementById('player-level');
const protectionEl = document.getElementById('player-protection');
const defenseEl = document.getElementById('total-defense');
const inventoryEl = document.getElementById('inventory');
const slotPeito = document.getElementById('slot-peito');

async function carregarDados() {
    try {
        const res = await fetch('/api/status');
        heroi = await res.json();
        
        await carregarInventario();
        atualizarUI();
    } catch (e) { console.error(e); }
}

async function carregarInventario() {
    const res = await fetch('/api/inventario');
    const itens = await res.json();
    heroi.inventario = itens;
}

function atualizarUI() {
    levelEl.innerText = heroi.nivel;
    protectionEl.innerText = heroi.protecao;
    
    // Bônus do item somado ao status atual
    let bonusDefesa = heroi.peito_defesa || 0;
    let defesaBase = heroi.protecao * 2; 
    defenseEl.innerText = `${defesaBase} (+${bonusDefesa})`;

    inventoryEl.innerHTML = '';
    heroi.inventario.forEach((item) => {
        if (item.tipo === 'equipamento') {
            const div = document.createElement('div');
            div.className = 'item-icon';
            div.innerHTML = `<img src="${item.imagem_url}" title="${item.nome}">`;
            div.onclick = () => equipItem(item);
            inventoryEl.appendChild(div);
        }
    });

    if (heroi.equip_peito) {
        slotPeito.innerHTML = `<img src="${heroi.peito_img}" title="${heroi.peito_nome}">`;
        slotPeito.onclick = () => unequipItem('peito');
    } else {
        slotPeito.innerHTML = '<span class="placeholder-icon">👕</span>';
        slotPeito.onclick = null;
    }
}

async function equipItem(item) {
    // Requisitos fixos da Camiseta Simples por enquanto
    const reqNivel = 2;
    const reqProtecao = 1;

    if (heroi.nivel < reqNivel) {
        alert(`Nível insuficiente! Requerido: ${reqNivel}`);
        return;
    }
    if (heroi.protecao < reqProtecao) {
        alert(`Proteção insuficiente! Requerido: ${reqProtecao}`);
        return;
    }

    try {
        const res = await fetch('/api/equipamentos/equipar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: item.item_id, slot: 'peito' })
        });
        const data = await res.json();
        if (data.sucesso) {
            await carregarDados();
        } else {
            alert(data.erro);
        }
    } catch (e) { console.error(e); }
}

async function unequipItem(slot) {
    try {
        const res = await fetch('/api/equipamentos/desequipar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot: slot })
        });
        const data = await res.json();
        if (data.sucesso) {
            await carregarDados();
        }
    } catch (e) { console.error(e); }
}

carregarDados();

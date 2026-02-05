// mochila.js - Adaptado para Equipar/Desequipar direto na Mochila

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
});

let heroStatus = null;

async function carregarDadosIniciais() {
    await carregarStatusHerói();
    await carregarInventario();
}

async function carregarStatusHerói() {
    try {
        const res = await fetch('/api/status');
        heroStatus = await res.json();

        document.getElementById('mochila-vida-atual').textContent = `❤️ Vida: ${Math.floor(heroStatus.vida_atual)} / ${heroStatus.vida_maxima}`;
        document.getElementById('mochila-mana-atual').textContent = `💙 Mana: ${Math.floor(heroStatus.mana_atual)} / ${heroStatus.mana_maxima}`;

        const atkMin = heroStatus.forca * 1;
        const atkMax = heroStatus.forca * 2;
        const defMin = heroStatus.protecao * 1;
        const defMax = (heroStatus.protecao * 2) + (heroStatus.peito_defesa || 0);

        document.getElementById('mochila-ataque-atual').textContent = `🗡 Ataque: ${atkMin} - ${atkMax}`;
        document.getElementById('mochila-defesa-atual').textContent = `🛡 Defesa: ${defMin} - ${defMax}`;

        // Atualizar o Slot de Peito na Mochila
        const slotPeito = document.getElementById('backpack-slot-peito');
        if (heroStatus.equip_peito) {
            slotPeito.innerHTML = `<img src="${heroStatus.peito_img}" title="${heroStatus.peito_nome}">`;
            slotPeito.onclick = () => {
                const itemEquipado = {
                    item_id: heroStatus.equip_peito,
                    nome: heroStatus.peito_nome,
                    imagem_url: heroStatus.peito_img,
                    tipo: 'equipamento',
                    descricao: 'Este item está equipado atualmente.',
                    defesa: heroStatus.peito_defesa,
                    nivel_requerido: heroStatus.peito_nivel_req,
                    protecao_requerida: heroStatus.peito_prot_req
                };
                mostrarDetalhes(itemEquipado, true);
            };
        } else {
            slotPeito.innerHTML = '<span class="placeholder-icon">👕</span>';
            slotPeito.onclick = null;
        }
    } catch (e) {
        console.error("Erro ao carregar status na mochila:", e);
    }
}

async function carregarInventario() {
    const grid = document.getElementById('inventario-grid');
    try {
        const response = await fetch('/api/inventario');
        const itens = await response.json();
        grid.innerHTML = '';

        if (itens.length === 0) {
            grid.innerHTML = '<p id="empty-message">Sua mochila está vazia por enquanto...</p>';
            return;
        }

        itens.forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'inventory-item';
            slot.innerHTML = `
                <img src="${item.imagem_url}" alt="${item.nome}">
                <span class="item-quantity">${item.quantidade}</span>
            `;
            slot.onclick = () => mostrarDetalhes(item, false);
            grid.appendChild(slot);
        });
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p id="empty-message">Erro ao carregar inventário.</p>';
    }
}

function mostrarDetalhes(item, estaEquipado) {
    const panel = document.getElementById('item-details-panel');
    const img = document.getElementById('detail-item-image');
    const name = document.getElementById('detail-item-name');
    const type = document.getElementById('detail-item-type');
    const desc = document.getElementById('detail-item-description');
    const stats = document.getElementById('detail-stats');
    const btnUse = document.getElementById('detail-use-button');
    const btnEquip = document.getElementById('detail-equip-button');
    const btnUnequip = document.getElementById('detail-unequip-button');

    panel.style.display = 'block';
    img.src = item.imagem_url;
    name.textContent = item.nome;
    type.textContent = item.tipo;
    desc.textContent = item.descricao;

    stats.innerHTML = '';
    btnUse.style.display = 'none';
    btnEquip.style.display = 'none';
    btnUnequip.style.display = 'none';

    if (item.tipo === 'equipamento') {
        // Exibe bônus e requisitos solicitados
        stats.innerHTML = `
            <strong>Atributos:</strong>
            <span class="detail-bonus-item">🛡 Defesa Máxima: +${item.defesa || 0}</span>
            <br>
            <strong>Requisitos:</strong>
            <span class="detail-req-item">🏅 Nível: ${item.nivel_requerido || 0}</span>
            <span class="detail-req-item">🛡 Proteção: ${item.protecao_requerida || 0}</span>
        `;

        if (estaEquipado) {
            btnUnequip.style.display = 'block';
            btnUnequip.onclick = () => desequiparItem();
        } else {
            btnEquip.style.display = 'block';
            btnEquip.onclick = () => equiparItem(item);
        }
    } else if (item.tipo === 'consumivel') {
        stats.innerHTML = `<strong>Efeito:</strong> Recupera vida ou mana.`;
        btnUse.style.display = 'block';
        btnUse.onclick = () => alert("Uso de item consumível em breve!");
    } else if (item.tipo === 'material') {
        stats.innerHTML = `<strong>Tipo:</strong> Material de Crafting/Drops.<br><em>Guarde para forjar equipamentos no futuro!</em>`;
    } else {
        stats.innerHTML = `<strong>Info:</strong> Item genérico.`;
    }
}

async function equiparItem(item) {
    // Requisitos: Nível 2 e Proteção 2
    const reqNivel = item.nivel_requerido || 2;
    const reqProtecao = item.protecao_requerida || 2;

    if (heroStatus.nivel < reqNivel) {
        alert(`Você precisa ser nível ${reqNivel} para equipar este item!`);
        return;
    }
    if (heroStatus.protecao < reqProtecao) {
        alert(`Você precisa de ${reqProtecao} pontos em Proteção!`);
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
            document.getElementById('item-details-panel').style.display = 'none';
            await carregarDadosIniciais();
        } else {
            alert(data.erro);
        }
    } catch (e) { console.error(e); }
}

async function desequiparItem() {
    try {
        const res = await fetch('/api/equipamentos/desequipar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot: 'peito' })
        });
        const data = await res.json();
        if (data.sucesso) {
            document.getElementById('item-details-panel').style.display = 'none';
            await carregarDadosIniciais();
        }
    } catch (e) { console.error(e); }
}

// =================================================================
// CONTROLE DO MENU LATERAL (SIDEBAR)
// =================================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('is-open');
    }
}
window.toggleSidebar = toggleSidebar;

// Fecha a sidebar ao clicar fora dela
document.addEventListener('click', (event) => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    if (sidebar && sidebar.classList.contains('is-open')) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('is-open');
        }
    }
});

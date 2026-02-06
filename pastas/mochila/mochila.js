// mochila.js - Versão Corrigida (Sem acentos e com suporte a Cabeça)

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
});

let heroStatus = null;

async function carregarDadosIniciais() {
    await carregarStatusHeroi(); // Chamada sem acento
    await carregarInventario();
}

async function carregarStatusHeroi() { // Definição sem acento
    try {
        const res = await fetch('/api/status');
        heroStatus = await res.json();

        // Atualização de textos de status
        document.getElementById('mochila-vida-atual').textContent = `❤️ Vida: ${Math.floor(heroStatus.vida_atual)} / ${heroStatus.vida_maxima}`;
        document.getElementById('mochila-mana-atual').textContent = `💙 Mana: ${Math.floor(heroStatus.mana_atual)} / ${heroStatus.mana_maxima}`;

        const atkMin = heroStatus.forca * 1;
        const atkMax = heroStatus.forca * 2;
        const defMin = heroStatus.protecao * 1;
        // Soma a defesa base com a defesa dos itens de peito e cabeça
        const defMax = (heroStatus.protecao * 2) + (heroStatus.peito_defesa || 0) + (heroStatus.cabeca_defesa_item || 0);

        document.getElementById('mochila-ataque-atual').textContent = `🗡 Ataque: ${atkMin} - ${atkMax}`;
        document.getElementById('mochila-defesa-atual').textContent = `🛡 Defesa: ${defMin} - ${defMax}`;

        // --- ATUALIZAR SLOT DE PEITO ---
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

        // --- ATUALIZAR SLOT DE CABEÇA ---
        const slotCabeca = document.getElementById('backpack-slot-cabeca');
        if (slotCabeca) { // Verifica se o slot existe no HTML
            if (heroStatus.cabeca_id) {
                slotCabeca.innerHTML = `<img src="${heroStatus.cabeca_img}" title="${heroStatus.cabeca_nome}">`;
                slotCabeca.onclick = () => {
                    const itemEquipado = {
                        item_id: heroStatus.cabeca_id,
                        nome: heroStatus.cabeca_nome,
                        imagem_url: heroStatus.cabeca_img,
                        tipo: 'cabeca',
                        descricao: 'Este item está equipado atualmente.',
                        defesa: heroStatus.cabeca_defesa_item,
                        nivel_requerido: heroStatus.cabeca_nivel_req,
                        protecao_requerida: heroStatus.cabeca_prot_req,
                        vitalidade_requerida: heroStatus.cabeca_vit_req
                    };
                    mostrarDetalhes(itemEquipado, true);
                };
            } else {
                slotCabeca.innerHTML = '<span class="placeholder-icon">🎩</span>';
                slotCabeca.onclick = null;
            }
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
        console.error("Erro ao carregar inventário:", error);
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

    if (item.tipo === 'equipamento' || item.tipo === 'cabeca') {
        let requisitosHTML = `
            <strong>Atributos:</strong>
            <span class="detail-bonus-item" style="display: block;">🛡 Defesa Máxima: +${item.defesa || 0}</span>
            <br>
            <strong>Requisitos:</strong>
            <span class="detail-req-item" style="display: block;">🏅 Nível: ${item.nivel_requerido || 0}</span>
            <span class="detail-req-item" style="display: block;">🛡 Proteção: ${item.protecao_requerida || 0}</span>
        `;

        if (item.tipo === 'cabeca' && item.vitalidade_requerida) {
            requisitosHTML += `<span class="detail-req-item" style="display: block;">❤️ Vitalidade: ${item.vitalidade_requerida}</span>`;
        }

        stats.innerHTML = requisitosHTML;

        if (estaEquipado) {
            btnUnequip.style.display = 'block';
            btnUnequip.onclick = () => desequiparItem(item.tipo);
        } else {
            btnEquip.style.display = 'block';
            btnEquip.onclick = () => equiparItem(item);
        }
    } else if (item.tipo === 'consumivel') {
        stats.innerHTML = `<strong>Efeito:</strong> Recupera vida ou mana.`;
        btnUse.style.display = 'block';
        btnUse.onclick = () => alert("Uso de item consumível em breve!");
    } else {
        stats.innerHTML = `<strong>Info:</strong> Item de material ou diverso.`;
    }
}

async function equiparItem(item) {
    const reqNivel = item.nivel_requerido || 0;
    const reqProtecao = item.protecao_requerida || 0;
    const reqVitalidade = item.vitalidade_requerida || 0;

    if (heroStatus.nivel < reqNivel) {
        alert(`Nível insuficiente! Requerido: ${reqNivel}`);
        return;
    }
    if (heroStatus.protecao < reqProtecao) {
        alert(`Proteção insuficiente! Requerida: ${reqProtecao}`);
        return;
    }
    if (item.tipo === 'cabeca' && heroStatus.vitalidade < reqVitalidade) {
        alert(`Vitalidade insuficiente! Requerida: ${reqVitalidade}`);
        return;
    }

    try {
        let endpoint, body;

        if (item.tipo === 'cabeca') {
            endpoint = '/api/equipar/cabeca';
            body = JSON.stringify({ item_id: item.item_id });
        } else {
            endpoint = '/api/equipamentos/equipar';
            body = JSON.stringify({ item_id: item.item_id, slot: 'peito' });
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });
        const data = await res.json();
        if (data.sucesso) {
            document.getElementById('item-details-panel').style.display = 'none';
            await carregarDadosIniciais();
        } else {
            alert(data.erro);
        }
    } catch (e) { console.error("Erro ao equipar:", e); }
}

async function desequiparItem(tipoItem) {
    try {
        let endpoint, body;

        if (tipoItem === 'cabeca') {
            endpoint = '/api/desequipar/cabeca';
            body = JSON.stringify({ slot: 'cabeca' });
        } else {
            endpoint = '/api/equipamentos/desequipar';
            body = JSON.stringify({ slot: 'peito' });
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });
        const data = await res.json();
        if (data.sucesso) {
            document.getElementById('item-details-panel').style.display = 'none';
            await carregarDadosIniciais();
        }
    } catch (e) { console.error("Erro ao desequipar:", e); }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('is-open');
}
window.toggleSidebar = toggleSidebar;
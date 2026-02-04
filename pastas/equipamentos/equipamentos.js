let heroi = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
});

async function carregarDados() {
    try {
        const res = await fetch('/api/status');
        heroi = await res.json();
        
        atualizarStatusUI();
        await carregarInventario();
    } catch (e) { console.error("Erro ao carregar dados de equipamentos:", e); }
}

function atualizarStatusUI() {
    if (!heroi) return;

    document.getElementById('player-level-txt').textContent = `🏅 Nível: ${heroi.nivel}`;
    document.getElementById('player-protection-txt').textContent = `🛡️ Proteção: ${heroi.protecao}`;
    
    // Bônus do item somado ao status atual
    let bonusDefesa = heroi.peito_defesa || 0;
    let defesaBase = heroi.protecao * 2; 
    document.getElementById('total-defense-txt').textContent = `🛡️ Defesa Total: ${defesaBase} (+${bonusDefesa})`;

    const slotPeito = document.getElementById('slot-peito');
    if (heroi.equip_peito) {
        slotPeito.innerHTML = `<img src="${heroi.peito_img}" title="${heroi.peito_nome}">`;
        slotPeito.onclick = () => {
            const itemEquipado = {
                item_id: heroi.equip_peito,
                nome: heroi.peito_nome,
                imagem_url: heroi.peito_img,
                tipo: 'equipamento',
                descricao: 'Este item está equipado atualmente.',
                defesa: heroi.peito_defesa,
                nivel_requerido: heroi.peito_nivel_req,
                protecao_requerida: heroi.peito_prot_req
            };
            mostrarDetalhes(itemEquipado, true);
        };
    } else {
        slotPeito.innerHTML = '<span class="placeholder-icon">👕</span>';
        slotPeito.onclick = null;
    }
}

async function carregarInventario() {
    const grid = document.getElementById('inventory-grid');
    try {
        const response = await fetch('/api/inventario');
        const itens = await response.json();
        grid.innerHTML = ''; 

        // Filtra apenas equipamentos para esta página
        const equipamentos = itens.filter(i => i.tipo === 'equipamento');

        if (equipamentos.length === 0) {
            grid.innerHTML = '<p style="color: #aaa; padding: 20px;">Você não possui equipamentos na mochila...</p>';
            return;
        }

        equipamentos.forEach(item => {
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
        console.error("Erro ao carregar inventário de equipamentos:", error);
    }
}

function mostrarDetalhes(item, estaEquipado) {
    const panel = document.getElementById('item-details-panel');
    const img = document.getElementById('detail-item-image');
    const name = document.getElementById('detail-item-name');
    const type = document.getElementById('detail-item-type');
    const desc = document.getElementById('detail-item-description');
    const stats = document.getElementById('detail-stats');
    const btnEquip = document.getElementById('detail-equip-button');
    const btnUnequip = document.getElementById('detail-unequip-button');

    panel.style.display = 'block';
    img.src = item.imagem_url;
    name.textContent = item.nome;
    type.textContent = item.tipo;
    desc.textContent = item.descricao;

    stats.innerHTML = `
        <strong>Atributos:</strong>
        <span class="detail-bonus-item" style="color: #00ffcc; display: block; margin-top: 5px;">🛡 Defesa Máxima: +${item.defesa || 0}</span>
        <br>
        <strong>Requisitos:</strong>
        <span class="detail-req-item" style="display: block;">🏅 Nível: ${item.nivel_requerido || 0}</span>
        <span class="detail-req-item" style="display: block;">🛡 Proteção: ${item.protecao_requerida || 0}</span>
    `;

    btnEquip.style.display = 'none';
    btnUnequip.style.display = 'none';

    if (estaEquipado) {
        btnUnequip.style.display = 'block';
        btnUnequip.onclick = () => desequiparItem();
    } else {
        btnEquip.style.display = 'block';
        btnEquip.onclick = () => equiparItem(item);
    }
}

async function equiparItem(item) {
    const reqNivel = item.nivel_requerido || 0;
    const reqProtecao = item.protecao_requerida || 0;

    if (heroi.nivel < reqNivel) {
        alert(`Nível insuficiente! Requerido: ${reqNivel}`);
        return;
    }
    if (heroi.protecao < reqProtecao) {
        alert(`Proteção insuficiente! Requerida: ${reqProtecao}`);
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
            await carregarDados();
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
            await carregarDados();
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

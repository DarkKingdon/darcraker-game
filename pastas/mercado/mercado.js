// mercado.js

document.addEventListener('DOMContentLoaded', () => {
    carregarMercado();
    carregarItensParaVenda();
});

function showTab(tab, btn) {
    document.querySelectorAll('.market-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tab}`).classList.add('active');
    btn.classList.add('active');

    if (tab === 'meus-itens') {
        carregarMeusAnuncios();
    } else if (tab === 'comprar') {
        carregarMercado();
    }
}

async function carregarMercado() {
    const list = document.getElementById('market-list');
    try {
        const response = await fetch('/api/mercado');
        const vendas = await response.json();
        
        list.innerHTML = '';
        if (vendas.length === 0) {
            list.innerHTML = '<p style="color: #aaa; grid-column: 1/-1;">Não há itens à venda no momento.</p>';
            return;
        }

        vendas.forEach(v => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.innerHTML = `
                <img src="${v.imagem_url}" class="market-img">
                <h4>${v.item_nome}</h4>
                <small>Qtd: ${v.quantidade}</small>
                <span class="market-price">💰 ${v.preco} Ouro</span>
                <span class="market-vendedor">Vendedor: ${v.vendedor}</span>
                <button onclick="comprarItem(${v.venda_id})" class="btn-comprar">Comprar</button>
            `;
            list.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

async function carregarMeusAnuncios() {
    const list = document.getElementById('meus-anuncios-list');
    try {
        const response = await fetch('/api/mercado/meus-anuncios');
        const meusAnuncios = await response.json();
        
        list.innerHTML = '';
        if (meusAnuncios.length === 0) {
            list.innerHTML = '<p style="color: #aaa; grid-column: 1/-1;">Você não tem itens à venda.</p>';
            return;
        }

        meusAnuncios.forEach(v => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.innerHTML = `
                <img src="${v.imagem_url}" class="market-img">
                <h4>${v.item_nome}</h4>
                <small>Qtd: ${v.quantidade}</small>
                <span class="market-price">💰 ${v.preco} Ouro</span>
                <button onclick="cancelarAnuncio(${v.venda_id})" class="btn-comprar" style="background-color: #555;">Cancelar</button>
            `;
            list.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

async function cancelarAnuncio(venda_id) {
    if (!confirm("Deseja cancelar este anúncio? O item voltará para sua mochila.")) return;

    try {
        const response = await fetch('/api/mercado/cancelar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ venda_id })
        });
        
        const res = await response.json();
        if (res.sucesso) {
            alert("Anúncio cancelado!");
            carregarMeusAnuncios();
            carregarItensParaVenda();
        } else {
            alert(res.erro || "Erro ao cancelar.");
        }
    } catch (e) { console.error(e); }
}

async function carregarItensParaVenda() {
    const select = document.getElementById('venda-item-select');
    try {
        const response = await fetch('/api/inventario');
        const itens = await response.json();
        
        select.innerHTML = '<option value="">Selecione um item da mochila...</option>';
        itens.forEach(i => {
            if (i.item_id !== 1) {
                const opt = document.createElement('option');
                opt.value = i.item_id;
                opt.textContent = `${i.nome} (Possui: ${i.quantidade})`;
                select.appendChild(opt);
            }
        });
    } catch (e) { console.error(e); }
}

async function anunciarItem() {
    const item_id = document.getElementById('venda-item-select').value;
    const quantidade = document.getElementById('venda-qtd').value;
    const preco = document.getElementById('venda-preco').value;

    if (!item_id) return alert("Selecione um item!");

    try {
        const response = await fetch('/api/mercado/vender', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ item_id, quantidade, preco })
        });
        
        const res = await response.json();
        if (res.sucesso) {
            alert("Item anunciado com sucesso!");
            location.reload();
        } else {
            alert(res.erro || "Erro ao anunciar.");
        }
    } catch (e) { console.error(e); }
}

async function comprarItem(venda_id) {
    if (!confirm("Deseja comprar este item?")) return;

    try {
        const response = await fetch('/api/mercado/comprar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ venda_id })
        });
        
        const res = await response.json();
        if (res.sucesso) {
            alert("Compra realizada com sucesso!");
            location.reload();
        } else {
            alert(res.erro || "Erro ao comprar.");
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

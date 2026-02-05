// wiki.js - Banco de Dados da Wiki

const WIKI_ITEMS = {
    // ID deve ser único e usado na URL (ex: item.html?id=maca)
    'maca': {
        nome: 'Maçã',
        img: '/pastas/img/maca.jpg',
        tipo: 'Consumível',
        descricao: 'Uma fruta vermelha e suculenta. Dizem que ajuda a recuperar as energias.',
        drops: [
            { monstro: 'Poring', chance: '25%' }
        ],
        valor_venda: '2 Moedas'
    },
    'moeda': {
        nome: 'Moeda de Ouro',
        img: '/pastas/img/moeda.jpg',
        tipo: 'Moeda',
        descricao: 'A moeda padrão de comércio do reino. Brilha intensamente.',
        drops: [
            { monstro: 'Todos (Comum)', chance: 'Variável' }
        ],
        valor_venda: '1 Moeda'
    },
    'sangue_tipo_1': {
        nome: 'Sangue Tipo 1',
        img: '/pastas/img/sangue_tipo_1.jpg',
        tipo: 'Material',
        descricao: 'Um frasco contendo um líquido vermelho viscoso. Usado em alquimia básica.',
        drops: [
            { monstro: 'Fabre', chance: '10%' }
        ],
        valor_venda: '5 Moedas'
    },
    'zaleia': {
        nome: 'Zaleia',
        img: '/pastas/img/zaleia.jpg',
        tipo: 'Material (Raro)',
        descricao: 'Uma pequena pedra preciosa de cor ciano. Muito valorizada por joalheiros.',
        drops: [
            { monstro: 'Fabre', chance: '50%' }
        ],
        valor_venda: '50 Moedas'
    },
    'camiseta_simples': {
        nome: 'Camiseta Simples',
        img: '/pastas/img/camiseta_simples.jpg',
        tipo: 'Equipamento (Peito)',
        descricao: 'Uma camiseta feita de algodão rústico. Protege contra mosquitos, mas não muito mais que isso.',
        drops: [
            { monstro: 'Loja', chance: '100% (Compra)' }
        ],
        valor_venda: '10 Moedas'
    }
};

// Função para renderizar lista de itens
function renderizarListaItens() {
    const grid = document.getElementById('itens-grid');
    if (!grid) return;

    Object.keys(WIKI_ITEMS).forEach(key => {
        const item = WIKI_ITEMS[key];
        const card = document.createElement('a');
        card.className = 'wiki-card';
        card.href = `item.html?id=${key}`;
        
        card.innerHTML = `
            <img src="${item.img}" alt="${item.nome}">
            <h3>${item.nome}</h3>
            <span>${item.tipo}</span>
        `;
        
        grid.appendChild(card);
    });
}

// Função para renderizar detalhes do item
function renderizarDetalhesItem() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const item = WIKI_ITEMS[id];

    if (!item) {
        document.getElementById('wiki-content').innerHTML = '<h2>Item não encontrado!</h2>';
        return;
    }

    document.getElementById('item-img').src = item.img;
    document.getElementById('item-nome').textContent = item.nome;
    document.getElementById('item-tipo').textContent = item.tipo;
    document.getElementById('item-desc').textContent = item.descricao;
    document.getElementById('item-valor').textContent = item.valor_venda;

    const dropsList = document.getElementById('item-drops');
    item.drops.forEach(drop => {
        const li = document.createElement('li');
        li.textContent = `${drop.monstro} (${drop.chance})`;
        dropsList.appendChild(li);
    });
}

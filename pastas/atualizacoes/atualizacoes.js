// atualizacoes.js - Sistema de Changelog do DarCraker

const VERSOES = {
    '0.0.0.1': {
        data: '05/02/2026',
        titulo: 'Lançamento Inicial - Sistema Base',
        novidades: {
            itens: [
                { nome: 'Moeda de Ouro', descricao: 'Moeda padrão do jogo' },
                { nome: 'Maçã', descricao: 'Consumível que recupera vida' },
                { nome: 'Camiseta Simples', descricao: 'Equipamento básico de peito' },
                { nome: 'Sangue Tipo 1', descricao: 'Material de alquimia dropado por Fabre' },
                { nome: 'Zaleia', descricao: 'Pedra preciosa rara dropada por Fabre' }
            ],
            monstros: [
                {
                    nome: 'Orlos',
                    nivel: 1,
                    vida: 5,
                    ataque: 1,
                    defesa: 0,
                    exp: 1,
                    drops: ['Moeda de Ouro (10%)', 'Maçã (25%)']
                },
                {
                    nome: 'Poring',
                    nivel: 1,
                    vida: 10,
                    ataque: 1,
                    defesa: 0,
                    exp: 1,
                    drops: ['Moeda de Ouro (10%)', 'Maçã (25%)']
                },
                {
                    nome: 'Fabre',
                    nivel: 2,
                    vida: 15,
                    ataque: 2,
                    defesa: 1,
                    exp: 2,
                    drops: ['Sangue Tipo 1 (10%)', 'Zaleia (50%)', 'Moeda de Ouro (15%)']
                }
            ],
            sistemas: [
                'Sistema de Combate com turnos',
                'Sistema de Inventário (Mochila)',
                'Sistema de Equipamentos',
                'Sistema de Level Up e Atributos',
                'Mercado P2P entre jogadores',
                'Ranking de jogadores',
                'Wiki de Itens e Monstros'
            ],
            mapas: [
                'Planícies de Asmon (Nível 1-10)'
            ]
        },
        melhorias: [
            'Temporizador de 3 segundos entre ataques',
            'Sistema de defesa dinâmica no combate',
            'Interface responsiva com sidebar'
        ]
    }
};

// Renderiza a lista de versões
function renderizarAtualizacoes() {
    const container = document.getElementById('atualizacoes-container');
    if (!container) return;

    // Ordena versões da mais recente para a mais antiga
    const versoes = Object.keys(VERSOES).reverse();

    versoes.forEach(versao => {
        const update = VERSOES[versao];
        const card = document.createElement('div');
        card.className = 'update-card';

        let html = `
            <div class="update-header">
                <h2>Versão ${versao}</h2>
                <span class="update-date">${update.data}</span>
            </div>
            <h3 class="update-title">${update.titulo}</h3>
        `;

        // Novos Itens
        if (update.novidades.itens && update.novidades.itens.length > 0) {
            html += `<div class="update-section">
                <h4>📦 Novos Itens</h4>
                <ul>`;
            update.novidades.itens.forEach(item => {
                html += `<li><strong>${item.nome}</strong> - ${item.descricao}</li>`;
            });
            html += `</ul></div>`;
        }

        // Novos Monstros
        if (update.novidades.monstros && update.novidades.monstros.length > 0) {
            html += `<div class="update-section">
                <h4>👾 Novos Monstros</h4>`;
            update.novidades.monstros.forEach(monstro => {
                html += `
                    <div class="monstro-info">
                        <strong>${monstro.nome}</strong> (Nível ${monstro.nivel})
                        <ul>
                            <li>❤️ Vida: ${monstro.vida}</li>
                            <li>⚔️ Ataque: ${monstro.ataque}</li>
                            <li>🛡️ Defesa: ${monstro.defesa}</li>
                            <li>⭐ EXP: ${monstro.exp}</li>
                            <li>💎 Drops: ${monstro.drops.join(', ')}</li>
                        </ul>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Novos Sistemas
        if (update.novidades.sistemas && update.novidades.sistemas.length > 0) {
            html += `<div class="update-section">
                <h4>⚙️ Sistemas Implementados</h4>
                <ul>`;
            update.novidades.sistemas.forEach(sistema => {
                html += `<li>${sistema}</li>`;
            });
            html += `</ul></div>`;
        }

        // Novos Mapas
        if (update.novidades.mapas && update.novidades.mapas.length > 0) {
            html += `<div class="update-section">
                <h4>🗺️ Novos Mapas</h4>
                <ul>`;
            update.novidades.mapas.forEach(mapa => {
                html += `<li>${mapa}</li>`;
            });
            html += `</ul></div>`;
        }

        // Melhorias
        if (update.melhorias && update.melhorias.length > 0) {
            html += `<div class="update-section">
                <h4>✨ Melhorias</h4>
                <ul>`;
            update.melhorias.forEach(melhoria => {
                html += `<li>${melhoria}</li>`;
            });
            html += `</ul></div>`;
        }

        card.innerHTML = html;
        container.appendChild(card);
    });
}

// Inicializa ao carregar a página
document.addEventListener('DOMContentLoaded', renderizarAtualizacoes);

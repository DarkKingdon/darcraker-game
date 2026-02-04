// rank.js

document.addEventListener('DOMContentLoaded', () => {
    carregarRanking();
});

async function carregarRanking() {
    const tbody = document.getElementById('rank-body');

    try {
        const response = await fetch('/api/rank');
        if (!response.ok) throw new Error('Falha ao carregar ranking');

        const ranking = await response.json();
        tbody.innerHTML = '';

        if (ranking.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Nenhum herói encontrado ainda...</td></tr>';
            return;
        }

        ranking.forEach((jogador, index) => {
            const posicao = index + 1;
            const tr = document.createElement('tr');

            // Classe especial para o top 3
            let posClass = '';
            if (posicao === 1) posClass = 'pos-1';
            else if (posicao === 2) posClass = 'pos-2';
            else if (posicao === 3) posClass = 'pos-3';

            const pctExp = (jogador.exp / jogador.exp_max) * 100;

            tr.innerHTML = `
                <td class="${posClass}">${posicao}º</td>
                <td>${jogador.nome}</td>
                <td>Nível ${jogador.nivel}</td>
                <td>
                    ${jogador.exp} / ${jogador.exp_max}
                    <div class="exp-bar-mini">
                        <div class="exp-fill-mini" style="width: ${pctExp}%"></div>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" style="color: red;">Erro ao carregar o ranking.</td></tr>';
    }
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

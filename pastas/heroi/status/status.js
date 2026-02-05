// status.js - Gerenciamento de Status do Herói

window.heroStatus = {};

const DOM = {
    level: document.getElementById('level-valor'),
    exp: document.getElementById('exp-valor'),
    expMax: document.getElementById('exp-max-valor'),
    pontos: document.getElementById('points-valor'),
    forca: document.getElementById('forca-valor'),
    protecao: document.getElementById('protecao-valor'),
    vitalidade: document.getElementById('vitalidade-valor'),
    inteligencia: document.getElementById('inteligencia-valor'),
    hpBar: document.getElementById('hp-bar-fill'),
    mpBar: document.getElementById('mp-bar-fill'),
    hpTexto: document.getElementById('hp-texto'),
    mpTexto: document.getElementById('mp-texto'),

    // Status Secundários Separados
    atkMin: document.getElementById('atk-min-val'),
    atkMax: document.getElementById('atk-max-val'),
    defMin: document.getElementById('def-min-val'),
    defMax: document.getElementById('def-max-val'),

    btns: document.querySelectorAll('.add-point-btn'),

    // CAMPOS DE BÔNUS
    bonusVida: document.getElementById('bonus-vida'),
    bonusMana: document.getElementById('bonus-mana'),
    bonusForca: document.getElementById('bonus-forca'),
    bonusProtecao: document.getElementById('bonus-protecao'),
    bonusVitalidade: document.getElementById('bonus-vitalidade'),
    bonusInteligencia: document.getElementById('bonus-inteligencia'),
    bonusAtkMin: document.getElementById('bonus-atk-min'),
    bonusAtkMax: document.getElementById('bonus-atk-max'),
    bonusDefMin: document.getElementById('bonus-def-min'),
    bonusDefMax: document.getElementById('bonus-def-max')
};

async function carregarDados() {
    try {
        const response = await fetch('/api/status');

        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) {
            const errData = await response.json();
            console.error("Erro no servidor (Banco de Dados):", response.status, errData.detalhe);
            alert("Erro ao carregar dados do banco: " + (errData.detalhe || "Erro desconhecido"));
            return;
        }

        const data = await response.json();
        console.log("Dados do Herói recebidos:", data);

        window.heroStatus = data;

        // --- CORREÇÃO AUTOMÁTICA DE NÍVEL ---
        // Verifica se o jogador tem XP suficiente para subir de nível mas travou
        await verificarLevelUp(window.heroStatus);

        atualizarTela();
    } catch (error) {
        console.error("Erro ao carregar status do herói:", error);
    }
}

function atualizarTela() {
    const status = window.heroStatus;
    if (!status || Object.keys(status).length === 0) return;

    if (DOM.level) DOM.level.textContent = status.nivel;
    if (DOM.exp) DOM.exp.textContent = status.exp;
    if (DOM.expMax) DOM.expMax.textContent = status.exp_max;
    if (DOM.pontos) DOM.pontos.textContent = status.pontos_disponiveis;

    if (DOM.forca) DOM.forca.textContent = status.forca;
    if (DOM.protecao) DOM.protecao.textContent = status.protecao;
    if (DOM.vitalidade) DOM.vitalidade.textContent = status.vitalidade;
    if (DOM.inteligencia) DOM.inteligencia.textContent = status.inteligencia;

    // Atualiza Bônus na tela
    if (DOM.bonusVida) DOM.bonusVida.textContent = `+${status.bonus_vida || 0}`;
    if (DOM.bonusMana) DOM.bonusMana.textContent = `+${status.bonus_mana || 0}`;
    if (DOM.bonusForca) DOM.bonusForca.textContent = `+${status.bonus_forca || 0}`;
    if (DOM.bonusProtecao) DOM.bonusProtecao.textContent = `+${status.bonus_protecao || 0}`;
    if (DOM.bonusVitalidade) DOM.bonusVitalidade.textContent = `+${status.bonus_vitalidade || 0}`;
    if (DOM.bonusInteligencia) DOM.bonusInteligencia.textContent = `+${status.bonus_inteligencia || 0}`;
    if (DOM.bonusAtkMin) DOM.bonusAtkMin.textContent = `+${status.bonus_ataque_min || 0}`;
    if (DOM.bonusAtkMax) DOM.bonusAtkMax.textContent = `+${status.bonus_ataque_max || 0}`;
    if (DOM.bonusDefMin) DOM.bonusDefMin.textContent = `+${status.bonus_defesa_min || 0}`;

    // Bônus de Defesa Máxima (Soma bônus fixo + bônus de equipamento)
    if (DOM.bonusDefMax) {
        const totalBonusDefMax = (status.bonus_defesa_max || 0) + (status.peito_defesa || 0);
        DOM.bonusDefMax.textContent = `+${totalBonusDefMax}`;
    }

    // Cálculos de Atributos Secundários
    status.ataque_min = status.forca * 1;
    status.ataque_max = status.forca * 2;
    status.defesa_min = status.protecao * 1;
    status.defesa_max = (status.protecao * 2) + (status.peito_defesa || 0);

    if (DOM.atkMin) DOM.atkMin.textContent = status.ataque_min;
    if (DOM.atkMax) DOM.atkMax.textContent = status.ataque_max;
    if (DOM.defMin) DOM.defMin.textContent = status.defesa_min;
    if (DOM.defMax) DOM.defMax.textContent = status.defesa_max;

    // Barras de HP/MP
    const pHp = (status.vida_atual / status.vida_maxima) * 100;
    const pMp = (status.mana_atual / status.mana_maxima) * 100;

    if (DOM.hpBar) DOM.hpBar.style.width = pHp + "%";
    if (DOM.mpBar) DOM.mpBar.style.width = pMp + "%";
    if (DOM.hpTexto) DOM.hpTexto.textContent = `${Math.floor(status.vida_atual)} / ${status.vida_maxima}`;
    if (DOM.mpTexto) DOM.mpTexto.textContent = `${Math.floor(status.mana_atual)} / ${status.mana_maxima}`;

    if (typeof window.renderizarStatusInicio === 'function') {
        window.renderizarStatusInicio();
    }
}

async function adicionarAtributo(attr) {
    const status = window.heroStatus;
    if (status.pontos_disponiveis > 0) {
        status.pontos_disponiveis--;
        status[attr]++;

        if (attr === 'vitalidade') {
            status.vida_maxima += 10;
            status.vida_atual += 10;
        }
        if (attr === 'inteligencia') {
            status.mana_maxima += 10;
            status.mana_atual += 10;
        }

        atualizarTela();

        try {
            await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(status)
            });
        } catch (e) {
            console.error("Erro ao salvar attributes:", e);
        }
    } else {
        alert("Você não possui pontos disponíveis!");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    if (DOM.btns) {
        DOM.btns.forEach(btn => {
            btn.onclick = () => adicionarAtributo(btn.getAttribute('data-attribute'));
        });
    }
});

async function verificarLevelUp(status) {
    const tabelaXP = {
        1: 5, 2: 10, 3: 20, 4: 35, 5: 50,
        6: 75, 7: 100, 8: 125, 9: 155, 10: 200
    };

    let mudou = false;

    // Enquanto tiver XP suficiente e não estiver no nível máximo
    while (status.nivel < 10 && status.exp >= (tabelaXP[status.nivel] || 9999)) {
        status.exp -= tabelaXP[status.nivel];
        status.nivel++;
        status.exp_max = tabelaXP[status.nivel];
        status.pontos_disponiveis++;

        // Recupera Vida e Mana ao subir de nível
        status.vida_atual = status.vida_maxima;
        status.mana_atual = status.mana_maxima;

        mudou = true;
    }

    if (mudou) {
        console.log("Correção de Nível aplicada! Novo Nível:", status.nivel);
        alert(`Opa! Detectamos que você tinha XP acumulado. Parabéns, você subiu para o Nível ${status.nivel}!`);

        try {
            await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(status)
            });
        } catch (e) {
            console.error("Erro ao salvar correção de nível:", e);
        }
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

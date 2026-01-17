let heroStatus = {};

const DOM = {
    level: document.getElementById('level-valor'),
    exp: document.getElementById('exp-valor'),
    pontos: document.getElementById('points-valor'),
    forca: document.getElementById('forca-valor'),
    protecao: document.getElementById('protecao-valor'),
    vitalidade: document.getElementById('vitalidade-valor'),
    inteligencia: document.getElementById('inteligencia-valor'),
    hpBar: document.getElementById('hp-bar-fill'),
    mpBar: document.getElementById('mp-bar-fill'),
    hpTexto: document.getElementById('hp-texto'),
    mpTexto: document.getElementById('mp-texto'),
    ataque: document.getElementById('ataque-valor'),
    defesa: document.getElementById('defesa-valor'),
    btns: document.querySelectorAll('.add-point-btn')
};

async function carregarDados() {
    try {
        const res = await fetch('/api/status');
        if (res.ok) {
            heroStatus = await res.json();
            atualizarTela();
        }
    } catch (e) { console.error("Erro ao carregar:", e); }
}

function atualizarTela() {
    // Básicos
    DOM.level.textContent = heroStatus.nivel;
    DOM.exp.textContent = heroStatus.exp;
    DOM.pontos.textContent = heroStatus.pontos_disponiveis;
    
    // Atributos
    DOM.forca.textContent = heroStatus.forca;
    DOM.protecao.textContent = heroStatus.protecao;
    DOM.vitalidade.textContent = heroStatus.vitalidade;
    DOM.inteligencia.textContent = heroStatus.inteligencia;

    // Cálculo de Ataque e Defesa (Exemplo baseado em Força/Proteção)
    heroStatus.ataque_min = heroStatus.forca * 2;
    heroStatus.ataque_max = heroStatus.forca * 3;
    heroStatus.defesa_min = heroStatus.protecao * 1;
    heroStatus.defesa_max = heroStatus.protecao * 2;

    DOM.ataque.textContent = `${heroStatus.ataque_min} - ${heroStatus.ataque_max}`;
    DOM.defesa.textContent = `${heroStatus.defesa_min} - ${heroStatus.defesa_max}`;

    // Barras de HP/MP
    const pHp = (heroStatus.vida_atual / heroStatus.vida_maxima) * 100;
    const pMp = (heroStatus.mana_atual / heroStatus.mana_maxima) * 100;

    DOM.hpBar.style.width = pHp + "%";
    DOM.mpBar.style.width = pMp + "%";
    DOM.hpTexto.textContent = `${heroStatus.vida_atual} / ${heroStatus.vida_maxima}`;
    DOM.mpTexto.textContent = `${heroStatus.mana_atual} / ${heroStatus.mana_maxima}`;
}

async function adicionarAtributo(attr) {
    if (heroStatus.pontos_disponiveis > 0) {
        heroStatus.pontos_disponiveis--;
        heroStatus[attr]++;

        // Lógica de bônus por atributo
        if (attr === 'vitalidade') {
            heroStatus.vida_maxima += 10;
            heroStatus.vida_atual += 10;
        }
        if (attr === 'inteligencia') {
            heroStatus.mana_maxima += 10;
            heroStatus.mana_atual += 10;
        }

        atualizarTela();
        
        // Salva no banco
        try {
            await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(heroStatus)
            });
        } catch (e) { console.error("Erro ao salvar:", e); }
    } else {
        alert("Você não possui pontos!");
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    DOM.btns.forEach(btn => {
        btn.onclick = () => adicionarAtributo(btn.getAttribute('data-attribute'));
    });
});

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.style.right = sb.style.right === '0px' ? '-250px' : '0px';
}
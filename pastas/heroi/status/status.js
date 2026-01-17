let heroStatus = {
    nivel: 1, pontos_disponiveis: 0,
    forca: 1, protecao: 1, vitalidade: 1, inteligencia: 1,
    vida_atual: 10, vida_maxima: 10, mana_atual: 10, mana_maxima: 10
};

const DOM = {
    level: document.getElementById('level-valor'),
    pontos: document.getElementById('points-valor'),
    forca: document.getElementById('forca-valor'),
    protecao: document.getElementById('protecao-valor'),
    vitalidade: document.getElementById('vitalidade-valor'),
    inteligencia: document.getElementById('inteligencia-valor'),
    vidaBar: document.getElementById('vida-bar'),
    manaBar: document.getElementById('mana-bar'),
    vidaTexto: document.getElementById('vida-texto'),
    manaTexto: document.getElementById('mana-texto'),
    addPointBtns: document.querySelectorAll('.add-point-btn')
};

async function carregarDados() {
    try {
        const res = await fetch('/api/status');
        if (res.ok) {
            const dados = await res.json();
            heroStatus = dados;
            atualizarTela();
        }
    } catch (e) { console.error("Erro ao carregar banco:", e); }
}

async function salvarDados() {
    try {
        await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroStatus)
        });
    } catch (e) { console.error("Erro ao salvar:", e); }
}

function atualizarTela() {
    if(DOM.level) DOM.level.textContent = heroStatus.nivel;
    if(DOM.pontos) DOM.pontos.textContent = heroStatus.pontos_disponiveis;
    if(DOM.forca) DOM.forca.textContent = heroStatus.forca;
    if(DOM.protecao) DOM.protecao.textContent = heroStatus.protecao;
    if(DOM.vitalidade) DOM.vitalidade.textContent = heroStatus.vitalidade;
    if(DOM.inteligencia) DOM.inteligencia.textContent = heroStatus.inteligencia;

    // Garante que o valor mínimo para o cálculo seja 1 (evita divisão por zero)
    const vMax = heroStatus.vida_maxima || 10; 
    const mMax = heroStatus.mana_maxima || 10;
    const vAtu = heroStatus.vida_atual || 0;
    const mAtu = heroStatus.mana_atual || 0;

    const pVida = (vAtu / vMax) * 100;
    const pMana = (mAtu / mMax) * 100;

    if(DOM.vidaBar) DOM.vidaBar.style.width = pVida + "%";
    if(DOM.manaBar) DOM.manaBar.style.width = pMana + "%";
}

function adicionarAtributo(attr) {
    if (heroStatus.pontos_disponiveis > 0) {
        heroStatus[attr]++;
        heroStatus.pontos_disponiveis--;
        if (attr === 'vitalidade') { heroStatus.vida_maxima += 10; heroStatus.vida_atual += 10; }
        if (attr === 'inteligencia') { heroStatus.mana_maxima += 10; heroStatus.mana_atual += 10; }
        atualizarTela();
        salvarDados();
    } else {
        alert("Sem pontos disponíveis!");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    DOM.addPointBtns.forEach(btn => {
        btn.onclick = () => {
            const attr = btn.getAttribute('data-attribute'); // Corrigido para pegar do HTML
            adicionarAtributo(attr);
        };
    });
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Verifica se a sidebar está visível ou escondida
        if (sidebar.style.right === '0px') {
            sidebar.style.right = '-250px';
        } else {
            sidebar.style.right = '0px';
        }
    }
}
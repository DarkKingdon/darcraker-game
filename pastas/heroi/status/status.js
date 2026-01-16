// --- CONFIGURAÇÕES TÉCNICAS ---
const EXP_POR_NIVEL = { 1: 5, 2: 20, 3: 60, 4: 90, 5: 130, 6: 170, 7: 200, 8: 250, 9: 300 };

// Objeto principal atualizado com status secundários
let heroStatus = {
    level: 1, exp: 0, pontosDisponiveis: 0, pontosMaestria: 0,
    forca: 1, protecao: 1, vitalidade: 1, inteligencia: 1,
    vidaAtual: 10, manaAtual: 10,
    // Novos campos para sincronizar com o banco
    ataqueMin: 1, ataqueMax: 2,
    defesaMin: 1, defesaMax: 2,
    vidaMaxima: 10, manaMaxima: 10
};

// Mapeamento dos elementos do HTML (incluindo os novos campos de ataque/defesa)
const DOM = {
    level: document.getElementById('level-valor'),
    exp: document.getElementById('exp-valor'),
    pontos: document.getElementById('points-valor'),
    forca: document.getElementById('forca-valor'),
    protecao: document.getElementById('protecao-valor'),
    vitalidade: document.getElementById('vitalidade-valor'),
    inteligencia: document.getElementById('inteligencia-valor'),
    // Novos elementos para exibir ataque e defesa
    ataque: document.getElementById('ataque-valor'),
    defesa: document.getElementById('defesa-valor'),
    vidaBar: document.getElementById('hp-bar-fill'),
    manaBar: document.getElementById('mp-bar-fill'),
    vidaTexto: document.getElementById('hp-texto'),
    manaTexto: document.getElementById('mp-texto'),
    addPointBtns: document.querySelectorAll('.add-point-btn')
};

// --- FUNÇÕES DE COMUNICAÇÃO COM O SERVIDOR ---

async function carregarStatusDoBanco() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error("Erro ao carregar");
        
        const data = await response.json();
        
        // Mapeia os dados do Banco para o Objeto JS, incluindo os novos campos
        heroStatus = {
            level: data.nivel,
            exp: data.exp,
            pontosDisponiveis: data.pontos_disponiveis,
            pontosMaestria: data.pontos_maestria,
            forca: data.forca,
            protecao: data.protecao,
            vitalidade: data.vitalidade,
            inteligencia: data.inteligencia,
            vidaAtual: data.vida_atual,
            manaAtual: data.mana_atual,
            ataqueMin: data.ataque_min || (data.forca * 1),
            ataqueMax: data.ataque_max || (data.forca * 2),
            defesaMin: data.defesa_min || (data.protecao * 1),
            defesaMax: data.defesa_max || (data.protecao * 2),
            vidaMaxima: data.vida_maxima || (data.vitalidade * 10),
            manaMaxima: data.mana_maxima || (data.inteligencia * 10)
        };

        renderizarStatus();
    } catch (err) {
        console.error("Erro ao sincronizar com o servidor:", err);
    }
}

async function salvarNoBanco() {
    try {
        // Envia o objeto heroStatus completo para o endpoint do app.js
        await fetch('/api/status/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroStatus)
        });
    } catch (err) {
        console.error("Erro ao salvar no banco:", err);
    }
}

// --- LÓGICA DE JOGO ---

function renderizarStatus() {
    if (!DOM.level) return; 

    // 1. CÁLCULOS DOS STATUS SECUNDÁRIOS (Sua regra de negócio)
    // Força: 1 min / 2 max por ponto
    heroStatus.ataqueMin = heroStatus.forca * 1;
    heroStatus.ataqueMax = heroStatus.forca * 2;
    
    // Proteção: 1 min / 2 max por ponto
    heroStatus.defesaMin = heroStatus.protecao * 1;
    heroStatus.defesaMax = heroStatus.protecao * 2;
    
    // Vitalidade e Inteligência: 10 por ponto
    heroStatus.vidaMaxima = heroStatus.vitalidade * 10;
    heroStatus.manaMaxima = heroStatus.inteligencia * 10;

    // 2. ATUALIZAÇÃO DA INTERFACE (DOM)
    DOM.level.textContent = heroStatus.level;
    DOM.exp.textContent = `${heroStatus.exp} / ${EXP_POR_NIVEL[heroStatus.level] || 'MAX'}`;
    DOM.pontos.textContent = heroStatus.pontosDisponiveis;
    
    DOM.forca.textContent = heroStatus.forca;
    DOM.protecao.textContent = heroStatus.protecao;
    DOM.vitalidade.textContent = heroStatus.vitalidade;
    DOM.inteligencia.textContent = heroStatus.inteligencia;

    // Exibe os novos valores de Ataque e Defesa no HTML
    if (DOM.ataque) DOM.ataque.textContent = `${heroStatus.ataqueMin} - ${heroStatus.ataqueMax}`;
    if (DOM.defesa) DOM.defesa.textContent = `${heroStatus.defesaMin} - ${heroStatus.defesaMax}`;

    // Atualiza Barras e Textos de Vida/Mana
    DOM.vidaBar.style.width = `${(heroStatus.vidaAtual / heroStatus.vidaMaxima) * 100}%`;
    DOM.manaBar.style.width = `${(heroStatus.manaAtual / heroStatus.manaMaxima) * 100}%`;

    if (DOM.vidaTexto) DOM.vidaTexto.textContent = `${heroStatus.vidaAtual} / ${heroStatus.vidaMaxima}`;
    if (DOM.manaTexto) DOM.manaTexto.textContent = `${heroStatus.manaAtual} / ${heroStatus.manaMaxima}`;
}

function adicionarPonto(atributo) {
    if (heroStatus.pontosDisponiveis > 0) {
        heroStatus[atributo]++;
        heroStatus.pontosDisponiveis--;
        
        // Recuperação imediata ao subir atributo de sustentação
        if (atributo === 'vitalidade') heroStatus.vidaAtual += 10;
        if (atributo === 'inteligencia') heroStatus.manaAtual += 10;

        renderizarStatus();
        salvarNoBanco(); 
    } else {
        alert("Você não tem pontos disponíveis!");
    }
}

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    carregarStatusDoBanco();

    DOM.addPointBtns.forEach(btn => {
        btn.onclick = () => {
            const attr = btn.getAttribute('data-attribute');
            adicionarPonto(attr);
        };
    });
});

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.toggle('is-open');
};
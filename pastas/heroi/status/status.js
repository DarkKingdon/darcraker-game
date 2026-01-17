// --- CONFIGURAÇÕES TÉCNICAS ---
let heroStatus = {
    level: 1, exp: 0, pontosDisponiveis: 0,
    forca: 1, protecao: 1, vitalidade: 1, inteligencia: 1,
    vidaAtual: 10, manaAtual: 10, vidaMaxima: 10, manaMaxima: 10
};

const DOM = {
    level: document.getElementById('level-valor'),
    exp: document.getElementById('exp-valor'),
    pontos: document.getElementById('points-valor'),
    forca: document.getElementById('forca-valor'),
    protecao: document.getElementById('protecao-valor'),
    vitalidade: document.getElementById('vitalidade-valor'),
    inteligencia: document.getElementById('inteligencia-valor'),
    ataque: document.getElementById('ataque-valor'),
    defesa: document.getElementById('defesa-valor'),
    vidaBar: document.getElementById('vida-bar'),
    manaBar: document.getElementById('mana-bar'),
    vidaTexto: document.getElementById('vida-texto'),
    manaTexto: document.getElementById('mana-texto'),
    addPointBtns: document.querySelectorAll('.add-point-btn')
};

async function carregarStatusDoBanco() {
    try {
        const resposta = await fetch('/api/status');
        if (resposta.ok) {
            const dados = await resposta.json();
            
            // Mapeia do Banco (snake_case) para o JS (camelCase)
            heroStatus = {
                level: dados.nivel,
                exp: dados.exp,
                pontosDisponiveis: dados.pontos_disponiveis,
                forca: dados.forca,
                protecao: dados.protecao,
                vitalidade: dados.vitalidade,
                inteligencia: dados.inteligencia,
                vidaAtual: dados.vida_atual,
                manaAtual: dados.mana_atual,
                vidaMaxima: dados.vida_maxima,
                manaMaxima: dados.mana_maxima
            };
            renderizarStatus();
        }
    } catch (erro) {
        console.error("Erro ao carregar:", erro);
    }
}

async function salvarNoBanco() {
    try {
        await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                forca: heroStatus.forca,
                protecao: heroStatus.protecao,
                vitalidade: heroStatus.vitalidade,
                inteligencia: heroStatus.inteligencia,
                pontos_disponiveis: heroStatus.pontosDisponiveis,
                vida_atual: heroStatus.vidaAtual,
                mana_atual: heroStatus.manaAtual
            })
        });
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
    }
}

function renderizarStatus() {
    if (DOM.level) DOM.level.textContent = heroStatus.level;
    if (DOM.exp) DOM.exp.textContent = heroStatus.exp;
    if (DOM.pontos) DOM.pontos.textContent = heroStatus.pontosDisponiveis;
    if (DOM.forca) DOM.forca.textContent = heroStatus.forca;
    if (DOM.protecao) DOM.protecao.textContent = heroStatus.protecao;
    if (DOM.vitalidade) DOM.vitalidade.textContent = heroStatus.vitalidade;
    if (DOM.inteligencia) DOM.inteligencia.textContent = heroStatus.inteligencia;

    // Cálculos simples de Ataque/Defesa
    const atkMin = heroStatus.forca * 2;
    const atkMax = heroStatus.forca * 3;
    const defMin = heroStatus.protecao * 1;
    const defMax = heroStatus.protecao * 2;

    if (DOM.ataque) DOM.ataque.textContent = `${atkMin} - ${atkMax}`;
    if (DOM.defesa) DOM.defesa.textContent = `${defMin} - ${defMax}`;

    // Barras
    DOM.vidaBar.style.width = `${(heroStatus.vidaAtual / heroStatus.vidaMaxima) * 100}%`;
    DOM.manaBar.style.width = `${(heroStatus.manaAtual / heroStatus.manaMaxima) * 100}%`;
    DOM.vidaTexto.textContent = `${heroStatus.vidaAtual} / ${heroStatus.vidaMaxima}`;
    DOM.manaTexto.textContent = `${heroStatus.manaAtual} / ${heroStatus.manaMaxima}`;
}

function adicionarPonto(atributo) {
    if (heroStatus.pontosDisponiveis > 0) {
        heroStatus[atributo]++;
        heroStatus.pontosDisponiveis--;
        
        // Bonus de vida/mana ao subir os status
        if (atributo === 'vitalidade') {
            heroStatus.vidaMaxima += 10;
            heroStatus.vidaAtual += 10;
        }
        if (atributo === 'inteligencia') {
            heroStatus.manaMaxima += 10;
            heroStatus.manaAtual += 10;
        }

        renderizarStatus();
        salvarNoBanco(); 
    } else {
        alert("Sem pontos!");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarStatusDoBanco();
    DOM.addPointBtns.forEach(btn => {
        btn.onclick = () => adicionarPonto(btn.dataset.attribute);
    });
});
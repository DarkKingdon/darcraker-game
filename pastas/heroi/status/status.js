// --- CONFIGURAÇÕES DO HERÓI ---
// Estes valores são os padrões, serão substituídos pelos do banco de dados
let heroStatus = {
    nivel: 1, 
    exp: 0, 
    pontos_disponiveis: 0,
    forca: 1, 
    protecao: 1, 
    vitalidade: 1, 
    inteligencia: 1,
    vida_atual: 10, 
    mana_atual: 10, 
    vida_maxima: 10, 
    mana_maxima: 10
};

// Mapeamento dos elementos do HTML (IDs devem ser iguais ao status.html)
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

// --- FUNÇÕES DE COMUNICAÇÃO COM O BACKEND ---

// Busca os dados do MySQL via API do Node.js
async function carregarDados() {
    try {
        const res = await fetch('/api/status'); // Rota definida no app.js
        if (res.ok) {
            const dadosDoBanco = await res.json();
            // Mescla os dados recebidos com o nosso objeto local
            heroStatus = { ...heroStatus, ...dadosDoBanco };
            atualizarTela();
        } else {
            console.error("Erro ao procurar dados: Utilizador não logado ou erro na rota.");
        }
    } catch (e) { 
        console.error("Erro na conexão com a API:", e); 
    }
}

// Salva as alterações (como novos pontos de atributo) no banco de dados
async function salvarDados() {
    try {
        await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroStatus)
        });
    } catch (e) { 
        console.error("Erro ao salvar no banco:", e); 
    }
}

// --- FUNÇÕES DE INTERFACE ---

function atualizarTela() {
    // Atualiza os textos simples
    if(DOM.level) DOM.level.textContent = heroStatus.nivel;
    if(DOM.pontos) DOM.pontos.textContent = heroStatus.pontos_disponiveis;
    if(DOM.forca) DOM.forca.textContent = heroStatus.forca;
    if(DOM.protecao) DOM.protecao.textContent = heroStatus.protecao;
    if(DOM.vitalidade) DOM.vitalidade.textContent = heroStatus.vitalidade;
    if(DOM.inteligencia) DOM.inteligencia.textContent = heroStatus.inteligencia;

    // Atualiza as barras de Vida e Mana (Cálculo de %)
    const pVida = (heroStatus.vida_atual / heroStatus.vida_maxima) * 100;
    const pMana = (heroStatus.mana_atual / heroStatus.mana_maxima) * 100;
    
    if(DOM.vidaBar) DOM.vidaBar.style.width = pVida + "%";
    if(DOM.manaBar) DOM.manaBar.style.width = pMana + "%";
    
    if(DOM.vidaTexto) DOM.vidaTexto.textContent = `${heroStatus.vida_atual}/${heroStatus.vida_maxima}`;
    if(DOM.manaTexto) DOM.manaTexto.textContent = `${heroStatus.mana_atual}/${heroStatus.mana_maxima}`;
}

function adicionarAtributo(attr) {
    if (heroStatus.pontos_disponiveis > 0) {
        heroStatus[attr]++; // Aumenta o atributo (ex: forca)
        heroStatus.pontos_disponiveis--; // Gasta 1 ponto
        
        // Lógica de bónus imediatos
        if (attr === 'vitalidade') {
            heroStatus.vida_maxima += 10;
            heroStatus.vida_atual += 10;
        }
        if (attr === 'inteligencia') {
            heroStatus.mana_maxima += 10;
            heroStatus.mana_atual += 10;
        }

        atualizarTela(); // Atualiza o visual
        salvarDados();   // Grava no Railway/MySQL
    } else {
        alert("Não tens pontos disponíveis!");
    }
}

// --- INICIALIZAÇÃO ---

// Garante que o código só corre depois do HTML estar pronto
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Carrega os dados do banco imediatamente
    carregarDados();

    // 2. Configura os cliques nos botões de "+"
    DOM.addPointBtns.forEach(btn => {
        btn.onclick = () => {
            // Pega o valor do "data-attribute" definido no HTML
            const atributo = btn.getAttribute('data-attribute');
            adicionarAtributo(atributo);
        };
    });
});
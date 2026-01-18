function verificarLevelUp(heroi) {
    const tabelaXP = {
        1: 5, 2: 10, 3: 20, 4: 35, 5: 50,
        6: 75, 7: 100, 8: 125, 9: 155, 10: 200
    };

    // Enquanto a exp atual for maior ou igual ao necessário para o nível atual
    if (heroi.exp >= tabelaXP[heroi.nivel]) {
        heroi.nivel += 1; // Sobe o nível
        heroi.exp_max = tabelaXP[heroi.nivel]; // Define o novo limite no banco
        heroi.pontos_disponiveis += 5; // Exemplo: ganha pontos para distribuir
        
        console.log("Subiu de nível!");
    }
}


let heroStatus = {};

const DOM = {
    level: document.getElementById('level-valor'),
    exp: document.getElementById('exp-valor'),
    expMax: document.getElementById('exp-max-valor'), // Adicionado para controlar o 100 fixo
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
        const response = await fetch('/api/status');

        // Se o servidor retornar 401 ou redirecionar (fazer cair no login)
        if (!response.ok || response.redirected) {
            window.location.href = '/login.html';
            return;
        }

        const data = await response.json();
        heroStatus = data;
        atualizarTela();
    } catch (error) {
        console.error("Erro ao carregar JSON:", error);
        // Se der erro de sintaxe, provavelmente é porque recebemos HTML em vez de JSON
    }
}

function atualizarTela() {
    // Básicos e Experiência
    DOM.level.textContent = heroStatus.nivel;
    DOM.exp.textContent = heroStatus.exp;
    // Puxa o valor da nova coluna 'exp_max' do banco de dados
    DOM.expMax.textContent = heroStatus.exp_max || 5; 
    DOM.pontos.textContent = heroStatus.pontos_disponiveis;
    
    // Atributos base
    DOM.forca.textContent = heroStatus.forca;
    DOM.protecao.textContent = heroStatus.protecao;
    DOM.vitalidade.textContent = heroStatus.vitalidade;
    DOM.inteligencia.textContent = heroStatus.inteligencia;

    // CÁLCULOS SOLICITADOS:
    // 1 de força = 1 ataque min / 2 ataque max
    heroStatus.ataque_min = heroStatus.forca * 1;
    heroStatus.ataque_max = heroStatus.forca * 2;
    
    // 1 de proteção = 1 defesa min / 2 defesa max
    heroStatus.defesa_min = heroStatus.protecao * 1;
    heroStatus.defesa_max = heroStatus.protecao * 2;

    DOM.ataque.textContent = `${heroStatus.ataque_min} - ${heroStatus.ataque_max}`;
    DOM.defesa.textContent = `${heroStatus.defesa_min} - ${heroStatus.defesa_max}`;

    // Barras de HP/MP baseadas em Vitalidade e Inteligência
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

        // Lógica de bônus por atributo (10 de vida/mana por ponto)
        if (attr === 'vitalidade') {
            heroStatus.vida_maxima += 10;
            heroStatus.vida_atual += 10;
        }
        if (attr === 'inteligencia') {
            heroStatus.mana_maxima += 10;
            heroStatus.mana_atual += 10;
        }

        atualizarTela();
        
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
let heroi, monstro;

async function iniciarBatalha() {
    // Busca dados do herói e do monstro simultaneamente
    const [resH, resM] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/monstro/Orlos')
    ]);
    
    heroi = await resH.json();
    monstro = await resM.json();
    monstro.vida_atual = monstro.vida_maxima;

    atualizarInterface();
}

function atualizarInterface() {
    // Atualiza Monstro
    const mPct = (monstro.vida_atual / monstro.vida_maxima) * 100;
    document.getElementById('m-hp-fill').style.width = mPct + "%";
    document.getElementById('m-hp-text').textContent = `${monstro.vida_atual}/${monstro.vida_maxima}`;
    document.getElementById('m-nome').textContent = monstro.nome;

    // Atualiza Herói
    const hPct = (heroi.vida_atual / heroi.vida_maxima) * 100;
    document.getElementById('h-hp-fill').style.width = hPct + "%";
    document.getElementById('h-hp-text').textContent = `${heroi.vida_atual}/${heroi.vida_maxima}`;
}

async function atacar() {
    // --- TURNO DO HERÓI ---
    let danoH = Math.floor(Math.random() * (heroi.ataque_max - heroi.ataque_min + 1)) + heroi.ataque_min;
    danoH = Math.max(0, danoH - monstro.defesa);
    monstro.vida_atual -= danoH;
    log(`Você causou ${danoH} de dano!`);

    if (monstro.vida_atual <= 0) {
        monstro.vida_atual = 0;
        atualizarInterface();
        return finalizarCombate(true);
    }

    // --- TURNO DO MONSTRO ---
    let danoM = Math.max(0, monstro.ataque - (heroi.defesa_min / 2)); // Defesa reduz dano
    heroi.vida_atual -= Math.floor(danoM);
    log(`${monstro.nome} te deu ${Math.floor(danoM)} de dano!`);

    if (heroi.vida_atual <= 0) {
        heroi.vida_atual = 0;
        atualizarInterface();
        return finalizarCombate(false);
    }

    atualizarInterface();
}

async function finalizarCombate(vitoria) {
    if (vitoria) {
        alert(`Vitória! Você ganhou ${monstro.exp_recompensa} de EXP.`);
        heroi.exp += monstro.exp_recompensa;
        
        // Aqui usamos a função de Level Up que você já tem no status.js
        // Se a exp passar do exp_max, sobe de nível
        if (heroi.exp >= heroi.exp_max) {
             heroi.nivel += 1;
             heroi.exp = 0;
             heroi.pontos_disponiveis += 5;
             heroi.exp_max += 10; // Aumenta dificuldade do próximo nível
        }
    } else {
        alert("Você foi derrotado!");
        heroi.vida_atual = 1; // Deixa o herói com 1 de vida para não travar o jogo
    }

    // Salva o novo estado do herói no banco
    await fetch('/api/status', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(heroi)
    });

    window.location.href = '/inicio.html';
}

function log(msg) {
    const l = document.getElementById('log-combate');
    l.innerHTML = `<p>${msg}</p>` + l.innerHTML;
}

iniciarBatalha();
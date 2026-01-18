let heroi, monstro;

async function iniciarBatalha() {
    try {
        const [resH, resM] = await Promise.all([
            fetch('/api/status'),
            fetch('/api/monstro/Orlos')
        ]);
        
        heroi = await resH.json();
        monstro = await resM.json();
        
        // Garante que o monstro comece com vida cheia (coluna correta: vida_maxIMA)
        monstro.vida_atual = monstro.vida_maxIMA || monstro.vida_maxima;

        atualizarInterface();
    } catch (err) {
        console.error("Erro ao carregar batalha:", err);
    }
}

function atualizarInterface() {
    if (monstro) {
        const vMaxM = monstro.vida_maxIMA || monstro.vida_maxima;
        const mPct = (monstro.vida_atual / vMaxM) * 100;
        document.getElementById('m-hp-fill').style.width = mPct + "%";
        document.getElementById('m-hp-text').textContent = `${monstro.vida_atual}/${vMaxM}`;
        document.getElementById('m-nome').textContent = monstro.nome;
    }

    if (heroi) {
        const hPct = (heroi.vida_atual / heroi.vida_maxima) * 100;
        document.getElementById('h-hp-fill').style.width = hPct + "%";
        document.getElementById('h-hp-text').textContent = `${Math.floor(heroi.vida_atual)}/${heroi.vida_maxima}`;
    }
}

async function atacar() {
    // --- TURNO DO HERÓI ---
    let danoH = Math.floor(Math.random() * (heroi.ataque_max - heroi.ataque_min + 1)) + heroi.ataque_min;
    danoH = Math.max(0, danoH - (monstro.defesa || 0));
    monstro.vida_atual -= danoH;
    log(`Você causou ${danoH} de dano!`);

    if (monstro.vida_atual <= 0) {
        monstro.vida_atual = 0;
        atualizarInterface();
        return finalizarCombate(true);
    }

    // --- TURNO DO MONSTRO ---
    // Usando a defesa do herói do seu SQL (defesa_min)
    let danoM = Math.max(0, monstro.ataque - (heroi.defesa_min || 0)); 
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
        log(`Vitória! +${monstro.exp_recompensa} EXP`);
        heroi.exp += monstro.exp_recompensa;

        // LÓGICA DE LEVEL UP (Mantida conforme seu código)
        if (heroi.exp >= heroi.exp_max) {
            heroi.nivel += 1;
            heroi.exp = 0; 
            heroi.pontos_disponiveis += 5;
            heroi.exp_max = heroi.nivel * 10;
            
            heroi.vida_atual = heroi.vida_maxima;
            heroi.mana_atual = heroi.mana_maxima;
            
            alert(`SUBIU DE NÍVEL! Agora você é nível ${heroi.nivel}`);
        }

        // SALVAR NO BANCO
        try {
            await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(heroi)
            });
        } catch (e) {
            console.error("Erro ao salvar progresso:", e);
        }

        // REDIRECIONAMENTO CORRIGIDO:
        // O caminho '/heroi.html' no seu app.js já aponta para '/pastas/heroi/heroi.html'
        setTimeout(() => { window.location.href = '/heroi.html'; }, 1500);

    } else {
        log("Você foi derrotado...");
        heroi.vida_atual = 1;
        await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroi)
        });
        // Opcional: Redirecionar para o herói também em caso de derrota
        setTimeout(() => { window.location.href = '/heroi.html'; }, 2000);
    }
}
function log(msg) {
    const l = document.getElementById('log-combate');
    l.innerHTML = `<p>${msg}</p>` + l.innerHTML;
}

iniciarBatalha();
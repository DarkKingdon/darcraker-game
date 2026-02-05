let heroi, monstro;

async function iniciarBatalha() {
    try {
        const [resH, resM] = await Promise.all([
            fetch('/api/status'),
            fetch('/api/monstro/Orlos')
        ]);

        heroi = await resH.json();
        monstro = await resM.json();

        // Garante que o monstro comece com vida cheia
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

        // Atualiza os valores de Ataque e Defesa baseados nos Status (Força e Proteção)
        // 1 Força = 1 Min Atk / 2 Max Atk
        // 1 Proteção = 1 Min Def / 2 Max Def + Equipamento
        heroi.ataque_min = heroi.forca * 1;
        heroi.ataque_max = heroi.forca * 2;
        heroi.defesa_min = heroi.protecao * 1;
        heroi.defesa_max = (heroi.protecao * 2) + (heroi.peito_defesa || 0) + (heroi.cabeca_defesa || 0);

        document.getElementById('h-atk-val').textContent = `${heroi.ataque_min} - ${heroi.ataque_max}`;
        document.getElementById('h-def-val').textContent = `${heroi.defesa_min} - ${heroi.defesa_max}`;
    }
}

async function atacar() {
    // Desabilita botão de ataque por 3 segundos
    const btnAtacar = document.querySelector('.btn-attack');
    btnAtacar.disabled = true;
    btnAtacar.style.opacity = '0.5';
    btnAtacar.style.cursor = 'not-allowed';

    // --- TURNO DO HERÓI ---
    let danoH = Math.floor(Math.random() * (heroi.ataque_max - heroi.ataque_min + 1)) + heroi.ataque_min;
    danoH = Math.max(0, danoH - (monstro.defesa || 0));
    monstro.vida_atual -= danoH;
    log(`Você causou <b style="color: #ff4d4d;">${danoH}</b> de dano!`);

    if (monstro.vida_atual <= 0) {
        monstro.vida_atual = 0;
        atualizarInterface();
        return finalizarCombate(true);
    }

    // --- TURNO DO MONSTRO ---
    // Defesa Dinâmica: Sorteia um valor entre o mínimo e o máximo de defesa do herói
    let defesaSorteada = Math.floor(Math.random() * (heroi.defesa_max - heroi.defesa_min + 1)) + heroi.defesa_min;
    let danoM = Math.max(0, monstro.ataque - defesaSorteada);

    heroi.vida_atual -= Math.floor(danoM);
    log(`${monstro.nome} te deu <b style="color: #ff4d4d;">${Math.floor(danoM)}</b> de dano! (Você defendeu ${defesaSorteada})`);

    if (heroi.vida_atual <= 0) {
        heroi.vida_atual = 0;
        atualizarInterface();
        return finalizarCombate(false);
    }

    atualizarInterface();

    // Reabilita botão após 3 segundos
    setTimeout(() => {
        btnAtacar.disabled = false;
        btnAtacar.style.opacity = '1';
        btnAtacar.style.cursor = 'pointer';
    }, 3000);
}

function fugir() {
    if (confirm("Deseja mesmo fugir da batalha? Sua vida atual será salva.")) {
        finalizarCombate(false, true);
    }
}

async function finalizarCombate(vitoria, fugiu = false) {
    if (vitoria) {
        log(`Vitória! +${monstro.exp_recompensa} EXP`);
        heroi.exp += monstro.exp_recompensa;

        const tabelaXP = {
            1: 5, 2: 10, 3: 20, 4: 35, 5: 50,
            6: 75, 7: 100, 8: 125, 9: 155, 10: 200
        };

        let subiu = false;
        while (heroi.exp >= tabelaXP[heroi.nivel] && heroi.nivel < 10) {
            heroi.exp -= tabelaXP[heroi.nivel];
            heroi.nivel += 1;
            heroi.exp_max = tabelaXP[heroi.nivel];
            heroi.pontos_disponiveis += 1;
            heroi.vida_atual = heroi.vida_maxima;
            heroi.mana_atual = heroi.mana_maxima;
            subiu = true;
        }

        if (subiu) alert(`SUBIU DE NÍVEL! Agora você é nível ${heroi.nivel}`);

        // Sorteio de Drops
        const sorteio = Math.random() * 100;
        if (sorteio <= 10) {
            log(`<b style="color: gold;">⭐ Você dropou uma Moeda de Ouro!</b>`);
            await adicionarAoInventario(1, 1);
        } else if (sorteio <= 25) {
            log(`<b style="color: #ff4d4d;">🍎 Você dropou uma Maça!</b>`);
            await adicionarAoInventario(2, 1);
        }
    } else if (fugiu) {
        log(`Você fugiu da batalha...`);
    } else {
        log(`Você foi derrotado...`);
    }

    // Salva o estado do herói (Vida, EXP, etc) no banco de dados
    try {
        await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroi)
        });
    } catch (e) { console.error(e); }

    setTimeout(() => { window.location.href = '/heroi.html'; }, 1500);
}

async function adicionarAoInventario(id, qtd) {
    try {
        await fetch('/api/inventario/adicionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: id, quantidade: qtd })
        });
    } catch (e) { console.error("Erro ao salvar drop:", e); }
}

function log(msg) {
    const l = document.getElementById('log-combate');
    l.innerHTML = `<p>${msg}</p>` + l.innerHTML;
}

iniciarBatalha();
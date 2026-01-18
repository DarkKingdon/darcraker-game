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
    // Atualiza Monstro (Atenção ao nome da coluna vida_maxima)
    if (monstro) {
        const mPct = (monstro.vida_atual / monstro.vida_maxima) * 100;
        document.getElementById('m-hp-fill').style.width = mPct + "%";
        document.getElementById('m-hp-text').textContent = `${monstro.vida_atual}/${monstro.vida_maxima}`;
        document.getElementById('m-nome').textContent = monstro.nome;
    }

    // Atualiza Herói (Nomes conforme seu darcraker_heroi_status.sql)
    if (heroi) {
        const hPct = (heroi.vida_atual / heroi.vida_maxima) * 100;
        document.getElementById('h-hp-fill').style.width = hPct + "%";
        document.getElementById('h-hp-text').textContent = `${heroi.vida_atual}/${heroi.vida_maxima}`;
    }
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
        log(`Vitória! Você ganhou ${monstro.exp_recompensa} de EXP.`);
        
        // 1. Adiciona a experiência do monstro ao herói
        heroi.exp += monstro.exp_recompensa;

        // 2. Verifica se subiu de nível (Ex: 5/5)
        if (heroi.exp >= heroi.exp_max) {
            heroi.nivel += 1; // Sobe para o nível 2
            heroi.exp = 0;    // Reseta a barra para 0/10 (ou o próximo alvo)
            heroi.pontos_disponiveis += 1; // Ganha 1 ponto para distribuir
            
            // Opcional: Aumentar a dificuldade do próximo nível (ex: dobrar o exp necessário)
            heroi.exp_max = heroi.nivel * 5; 
            
            alert(`PARABÉNS! Você subiu para o Nível ${heroi.nivel} e ganhou 1 ponto de atributo!`);
        }

        // 3. Salva tudo no banco de dados através da API
        try {
            const response = await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(heroi)
            });

            if (response.ok) {
                log("Progresso salvo com sucesso!");
                setTimeout(() => {
                    window.location.href = '/status.html'; // Redireciona para ver os pontos
                }, 2000);
            }
        } catch (erro) {
            console.error("Erro ao salvar progresso:", erro);
        }

    } else {
        alert("Você foi derrotado! Volte quando estiver mais forte.");
        // Penalidade opcional: herói volta com 1 de vida
        heroi.vida_atual = 1;
        await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroi)
        });
        window.location.href = '/inicio.html';
    }
}

function log(msg) {
    const l = document.getElementById('log-combate');
    l.innerHTML = `<p>${msg}</p>` + l.innerHTML;
}

iniciarBatalha();
let heroi, monstro;
let isCombatActive = true;
let isHeroTurnReady = false;
let atbInterval;
const ATB_TIME_SECONDS = 3;

async function iniciarBatalha() {
    try {
        const [resH, resM] = await Promise.all([
            fetch('/api/status'),
            fetch('/api/monstro/Poring')
        ]);

        heroi = await resH.json();
        monstro = await resM.json();

        monstro.vida_atual = monstro.vida_maxima || 3;

        atualizarInterface();
        startATB();
    } catch (err) {
        console.error("Erro ao carregar batalha:", err);
    }
}

function atualizarInterface() {
    if (monstro) {
        const vMaxM = monstro.vida_maxima || 3;
        const mPct = (monstro.vida_atual / vMaxM) * 100;
        document.getElementById('m-hp-fill').style.width = mPct + "%";
        document.getElementById('m-hp-text').textContent = `${monstro.vida_atual}/${vMaxM}`;
        document.getElementById('m-nome').textContent = monstro.nome;
    }

    if (heroi) {
        const hPct = (heroi.vida_atual / heroi.vida_maxima) * 100;
        document.getElementById('h-hp-fill').style.width = hPct + "%";
        document.getElementById('h-hp-text').textContent = `${Math.floor(heroi.vida_atual)}/${heroi.vida_maxima}`;

        heroi.ataque_min = heroi.forca * 1;
        heroi.ataque_max = heroi.forca * 2;
        heroi.defesa_min = heroi.protecao * 1;
        heroi.defesa_max = (heroi.protecao * 2) + (heroi.peito_defesa || 0) + (heroi.cabeca_defesa || 0);

        document.getElementById('h-atk-val').textContent = `${heroi.ataque_min} - ${heroi.ataque_max}`;
        document.getElementById('h-def-val').textContent = `${heroi.defesa_min} - ${heroi.defesa_max}`;
    }
}

function startATB() {
    if (!isCombatActive) return;

    isHeroTurnReady = false;
    const bar = document.getElementById('atb-fill');
    const status = document.getElementById('atb-status');
    const btn = document.getElementById('btn-atacar');

    if (bar) bar.style.width = "0%";
    if (bar) bar.classList.remove('full');
    if (status) status.textContent = "Carregando...";
    if (btn) btn.disabled = true;

    let progress = 0;
    const step = 100 / (ATB_TIME_SECONDS * 20); // 20 frames per second

    clearInterval(atbInterval);
    atbInterval = setInterval(() => {
        if (!isCombatActive) {
            clearInterval(atbInterval);
            return;
        }

        progress += step;
        if (progress >= 100) {
            progress = 100;
            clearInterval(atbInterval);
            handleTurnReady();
        }
        if (bar) bar.style.width = progress + "%";
    }, 50);
}

function handleTurnReady() {
    isHeroTurnReady = true;
    const bar = document.getElementById('atb-fill');
    const status = document.getElementById('atb-status');
    const btn = document.getElementById('btn-atacar');

    if (bar) bar.classList.add('full');
    if (status) status.textContent = "PRONTO!";
    if (btn) btn.disabled = false;
}

function tentarAtacar() {
    if (isHeroTurnReady && isCombatActive) {
        executarTurno();
    }
}

async function executarTurno() {
    isHeroTurnReady = false;
    document.getElementById('btn-atacar').disabled = true;

    // Turno do Herói
    let danoH = Math.floor(Math.random() * (heroi.ataque_max - heroi.ataque_min + 1)) + heroi.ataque_min;
    danoH = Math.max(1, danoH - (monstro.defesa || 0)); // Mínimo de 1 de dano

    monstro.vida_atual -= danoH;
    showFloatingDamage(danoH, 'monstro-area');
    shakeElement('m-img-container');
    log(`Você causou <b style="color: #ff4d4d;">${danoH}</b> de dano!`);

    atualizarInterface();

    if (monstro.vida_atual <= 0) {
        monstro.vida_atual = 0;
        atualizarInterface();
        isCombatActive = false;
        
        // Notificar a página de missões sobre a derrota do inimigo
        if (window.parent && window.parent !== window) {
            // Se estiver em um iframe, tenta chamar a função no parent
            try {
                if (window.parent.notificarDerrotaInimigo) {
                    window.parent.notificarDerrotaInimigo(monstro.nome || 'poring');
                }
            } catch(e) {
                console.log("Não foi possível notificar a página de missões (iframe)");
            }
        } else {
            // Se for a janela principal, chama diretamente
            if (window.notificarDerrotaInimigo) {
                window.notificarDerrotaInimigo(monstro.nome || 'poring');
            }
        }
        
        return finalizarCombate(true);
    }

    // Turno do Monstro (após pequeno delay)
    setTimeout(() => {
        if (!isCombatActive) return;

        let defesaSorteada = Math.floor(Math.random() * (heroi.defesa_max - heroi.defesa_min + 1)) + heroi.defesa_min;
        let danoM = Math.max(0, monstro.ataque - defesaSorteada);

        heroi.vida_atual -= Math.floor(danoM);
        showFloatingDamage(Math.floor(danoM), 'heroi-area');
        shakeElement('h-img-container');
        log(`${monstro.nome} te deu <b style="color: #ff4d4d;">${Math.floor(danoM)}</b> de dano! (Defesa: ${defesaSorteada})`);

        atualizarInterface();

        if (heroi.vida_atual <= 0) {
            heroi.vida_atual = 0;
            atualizarInterface();
            isCombatActive = false;
            return finalizarCombate(false);
        }

        // Reinicia o ATB para o próximo turno
        startATB();
    }, 800);
}

function showFloatingDamage(amount, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const dmgDiv = document.createElement('div');
    dmgDiv.className = 'floating-damage';
    dmgDiv.textContent = `-${amount}`;

    // Posicionamento aleatório leve para não sobrepor sempre
    const randomX = Math.random() * 40 - 20;
    dmgDiv.style.left = `calc(50% + ${randomX}px)`;

    target.appendChild(dmgDiv);

    setTimeout(() => {
        dmgDiv.remove();
    }, 800);
}

function shakeElement(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hit-shake');
    setTimeout(() => {
        el.classList.remove('hit-shake');
    }, 400);
}

function fugir() {
    if (confirm("Deseja mesmo fugir da batalha? Sua vida atual será salva.")) {
        isCombatActive = false;
        finalizarCombate(false, true);
    }
}

async function finalizarCombate(vitoria, fugiu = false) {
    isCombatActive = false;
    clearInterval(atbInterval);

    if (vitoria) {
        log(`Vitória! +${monstro.exp_recompensa} EXP`);
        heroi.exp += monstro.exp_recompensa;

        const tabelaXP = { 1: 5, 2: 10, 3: 20, 4: 35, 5: 50, 6: 75, 7: 100, 8: 125, 9: 155, 10: 200 };
        let subiu = false;
        while (heroi.exp >= (tabelaXP[heroi.nivel] || 999999) && heroi.nivel < 10) {
            heroi.exp -= tabelaXP[heroi.nivel];
            heroi.nivel += 1;
            heroi.pontos_disponiveis += 1;
            heroi.vida_atual = heroi.vida_maxima;
            heroi.mana_atual = heroi.mana_maxima;
            subiu = true;
        }

        if (subiu) alert(`SUBIU DE NÍVEL! Agora você é nível ${heroi.nivel}`);

        const sorteio = Math.random() * 100;
        if (sorteio <= 50) {
            log(`<b style="color: #3498db;">👕 Você dropou uma Camiseta Simples!</b>`);
            await adicionarAoInventario(3, 1);
        } else if (sorteio <= 60) {
            log(`<b style="color: gold;">⭐ Você dropou uma Moeda de Ouro!</b>`);
            await adicionarAoInventario(1, 1);
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

    // Atualizar o progresso da missão de derrotar Poring
    try {
        await fetch('/api/progresso-missoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                missao_id: '1', // ID da missão de derrotar Poring
                incremento: 1
            })
        });
    } catch(e) {
        console.log("Erro ao atualizar progresso da missão:", e);
    }

    setTimeout(() => { window.location.href = '/heroi.html'; }, 2000);
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
    if (!l) return;
    l.innerHTML = `<p>${msg}</p>` + l.innerHTML;
}

iniciarBatalha();

// =================================================================
// CONTROLE DO MENU LATERAL (SIDEBAR)
// =================================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('is-open');
    }
}
window.toggleSidebar = toggleSidebar;

// Fecha a sidebar ao clicar fora dela
document.addEventListener('click', (event) => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    if (sidebar && sidebar.classList.contains('is-open')) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('is-open');
        }
    }
});

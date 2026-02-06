// Sistema de Missões para Asmon
document.addEventListener('DOMContentLoaded', function() {
    // Carrega o status do herói
    carregarStatusHeroi().catch(error => {
        console.error('Erro ao carregar status do herói:', error);
    });
    
    // Adiciona eventos aos botões de missão
    document.querySelectorAll('.accept-mission').forEach(button => {
        button.addEventListener('click', function() {
            const missionId = this.getAttribute('data-mission-id');
            aceitarMissao(missionId);
        });
    });
    
    document.querySelectorAll('.complete-mission').forEach(button => {
        button.addEventListener('click', function() {
            const missionId = this.getAttribute('data-mission-id');
            completarMissao(missionId);
        });
    });
    
    document.querySelectorAll('.abandon-mission').forEach(button => {
        button.addEventListener('click', function() {
            const missionId = this.getAttribute('data-mission-id');
            desistirMissao(missionId);
        });
    });
    
    // Carrega o progresso das missões salvas
    carregarProgressoMissoes();
});

// Função para carregar o status do herói
async function carregarStatusHeroi() {
    try {
        const response = await fetch('/api/status');
        if(response.ok) {
            const heroi = await response.json();
            atualizarInterfaceHeroi(heroi);
        } else {
            console.error('Falha ao carregar status do herói');
        }
    } catch (error) {
        console.error('Erro ao carregar status do herói:', error);
    }
}

// Função para atualizar a interface do herói
function atualizarInterfaceHeroi(heroi) {
    // Atualiza informações básicas do herói na interface
    document.querySelectorAll('.hero-nome').forEach(element => {
        element.textContent = heroi.nome || 'Aventureiro';
    });
    
    document.querySelectorAll('.hero-nivel').forEach(element => {
        element.textContent = heroi.nivel || 1;
    });
    
    document.querySelectorAll('.hero-exp').forEach(element => {
        element.textContent = `${heroi.exp || 0}/${heroi.exp_max || 100}`;
    });
    
    document.querySelectorAll('.hero-honra').forEach(element => {
        element.textContent = heroi.pontos_honra || 0;
    });
}

// Função para aceitar uma missão
function aceitarMissao(missionId) {
    // Verifica se o jogador já aceitou esta missão
    const missoesAceitas = JSON.parse(localStorage.getItem('missoesAceitas') || '{}');
    
    if (missoesAceitas[missionId]) {
        alert('Você já aceitou esta missão!');
        return;
    }
    
    // Aceita a missão
    missoesAceitas[missionId] = {
        aceita: true,
        progresso: 0,
        objetivo: getObjetivoMissao(missionId)
    };
    
    localStorage.setItem('missoesAceitas', JSON.stringify(missoesAceitas));
    
    // Atualiza a interface
    atualizarInterfaceMissao(missionId);
    
    // Exibe mensagem de confirmação
    const nomeMissao = getNomeMissao(missionId);
    alert(`Missão "${nomeMissao}" aceita! Boa sorte na sua jornada.`);
}

// Função para completar uma missão
function completarMissao(missionId) {
    const missoesAceitas = JSON.parse(localStorage.getItem('missoesAceitas') || '{}');
    const missao = missoesAceitas[missionId];
    
    if (!missao || !missao.aceita || missao.progresso < missao.objetivo) {
        alert('Você ainda não completou os objetivos desta missão!');
        return;
    }
    
    // Remove a missão da lista de aceitas
    delete missoesAceitas[missionId];
    localStorage.setItem('missoesAceitas', JSON.stringify(missoesAceitas));
    
    // Entrega recompensa
    entregarRecompensa(missionId);
    
    // Atualiza a interface
    atualizarInterfaceMissao(missionId);
    
    // Exibe mensagem de conclusão
    const nomeMissao = getNomeMissao(missionId);
    alert(`Parabéns! Você completou a missão "${nomeMissao}" e recebeu sua recompensa.`);
}

// Função para desistir de uma missão
function desistirMissao(missionId) {
    if (!confirm('Tem certeza que deseja desistir desta missão? Todo o progresso será perdido.')) {
        return;
    }
    
    const missoesAceitas = JSON.parse(localStorage.getItem('missoesAceitas') || '{}');
    
    // Remove a missão da lista de aceitas
    delete missoesAceitas[missionId];
    localStorage.setItem('missoesAceitas', JSON.stringify(missoesAceitas));
    
    // Atualiza a interface
    atualizarInterfaceMissao(missionId);
    
    // Exibe mensagem de confirmação
    const nomeMissao = getNomeMissao(missionId);
    alert(`Você desistiu da missão "${nomeMissao}". Poderá aceitá-la novamente quando quiser.`);
}

// Função para atualizar o progresso da missão (seria chamada ao derrotar um inimigo)
function atualizarProgressoMissao(missionId, incremento = 1) {
    console.log(`Atualizando progresso da missão ${missionId}, incremento: ${incremento}`); // Debug
    const missoesAceitas = JSON.parse(localStorage.getItem('missoesAceitas') || '{}');
    const missao = missoesAceitas[missionId];
    
    console.log(`Missão antes da atualização:`, missao); // Debug
    
    if (missao && missao.aceita && missao.progresso < missao.objetivo) {
        missao.progresso += incremento;
        localStorage.setItem('missoesAceitas', JSON.stringify(missoesAceitas));
        
        console.log(`Progresso atualizado: ${missao.progresso}/${missao.objetivo}`); // Debug
        
        // Atualiza a interface
        atualizarInterfaceMissao(missionId);
        
        // Verifica se a missão foi completada
        if (missao.progresso >= missao.objetivo) {
            mostrarBotaoConcluir(missionId);
        }
    } else {
        console.log(`Condições não atendidas para atualizar missão ${missionId}:`, {
            missao: !!missao,
            aceita: missao?.aceita,
            abaixoObjetivo: missao?.progresso < missao?.objetivo
        }); // Debug
    }
}

// Função para atualizar a interface da missão
function atualizarInterfaceMissao(missionId) {
    const missao = JSON.parse(localStorage.getItem('missoesAceitas') || '{}')[missionId];
    const progressElement = document.querySelector(`.progress-fill[data-mission="${missionId}"]`);
    const progressText = document.querySelector(`.progress-text[data-mission="${missionId}"]`);
    const acceptButton = document.querySelector(`.accept-mission[data-mission-id="${missionId}"]`);
    const completeButton = document.querySelector(`.complete-mission[data-mission-id="${missionId}"]`);
    const abandonButton = document.querySelector(`.abandon-mission[data-mission-id="${missionId}"]`);
    
    if (missao) {
        const percentual = (missao.progresso / missao.objetivo) * 100;
        if (progressElement) {
            progressElement.style.width = `${percentual}%`;
        }
        if (progressText) {
            progressText.textContent = `${missao.progresso}/${missao.objetivo} Poring derrotados`;
        }
        if (acceptButton) {
            acceptButton.style.display = 'none';
        }
        if (completeButton) {
            completeButton.style.display = missao.progresso >= missao.objetivo ? 'inline-block' : 'none';
        }
        if (abandonButton) {
            abandonButton.style.display = 'inline-block';
        }
    } else {
        // Se a missão não está mais ativa, resetar a interface
        if (progressElement) {
            progressElement.style.width = '0%';
        }
        if (progressText) {
            progressText.textContent = '0/10 Poring derrotados';
        }
        if (acceptButton) {
            acceptButton.style.display = 'inline-block';
        }
        if (completeButton) {
            completeButton.style.display = 'none';
        }
        if (abandonButton) {
            abandonButton.style.display = 'none';
        }
    }
}

// Função para carregar o progresso das missões
function carregarProgressoMissoes() {
    const missoesAceitas = JSON.parse(localStorage.getItem('missoesAceitas') || '{}');
    
    for (const missionId in missoesAceitas) {
        atualizarInterfaceMissao(missionId);
        
        // Verifica se a missão está completa para mostrar o botão de concluir
        const missao = missoesAceitas[missionId];
        if (missao.progresso >= missao.objetivo) {
            mostrarBotaoConcluir(missionId);
        }
    }
}

// Função para mostrar o botão de concluir missão
function mostrarBotaoConcluir(missionId) {
    const completeButton = document.querySelector(`.complete-mission[data-mission-id="${missionId}"]`);
    const abandonButton = document.querySelector(`.abandon-mission[data-mission-id="${missionId}"]`);
    if (completeButton) {
        completeButton.style.display = 'inline-block';
    }
    if (abandonButton) {
        abandonButton.style.display = 'inline-block';
    }
}

// Função para entregar recompensa ao completar missão
async function entregarRecompensa(missionId) {
    // Recompensas baseadas na missão
    let experiencia = 0;
    let moedas = 0;
    let pontosHonra = 0;
    
    switch(missionId) {
        case '1':
            experiencia = 5; // 5 de experiência
            moedas = 1; // 1 moeda
            pontosHonra = 1; // 1 ponto de honra
            break;
        default:
            experiencia = 1;
            moedas = 1;
            pontosHonra = 1;
    }
    
    try {
        // Atualiza o status do herói no servidor
        const response = await fetch('/api/status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if(response.ok) {
            const heroi = await response.json();
            
            // Atualiza os valores
            heroi.exp += experiencia;
            heroi.pontos_honra = (heroi.pontos_honra || 0) + pontosHonra; // Adiciona pontos de honra
            
            // Verifica se ganhou nível
            if(heroi.exp >= heroi.exp_max) {
                heroi.nivel++;
                heroi.exp -= heroi.exp_max;
                heroi.exp_max = Math.floor(heroi.exp_max * 1.2); // Aumenta o XP necessário para o próximo nível
                heroi.pontos_disponiveis += 5; // Ganha 5 pontos de atributo
            }
            
            // Atualiza inventário com as moedas
            await fetch('/api/inventario/adicionar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    item_id: 1, // ID da moeda de ouro
                    quantidade: moedas
                })
            });
            
            // Salva as alterações no servidor
            const updateResponse = await fetch('/api/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nivel: heroi.nivel,
                    exp: heroi.exp,
                    exp_max: heroi.exp_max,
                    forca: heroi.forca,
                    protecao: heroi.protecao,
                    vitalidade: heroi.vitalidade,
                    inteligencia: heroi.inteligencia,
                    pontos_disponiveis: heroi.pontos_disponiveis,
                    pontos_maestria: heroi.pontos_maestria,
                    vida_maxima: heroi.vida_maxima,
                    mana_maxima: heroi.mana_maxima,
                    vida_atual: heroi.vida_atual,
                    mana_atual: heroi.mana_atual,
                    ataque_min: heroi.ataque_min,
                    ataque_max: heroi.ataque_max,
                    defesa_min: heroi.defesa_min,
                    defesa_max: heroi.defesa_max,
                    bonus_vida: heroi.bonus_vida,
                    bonus_mana: heroi.bonus_mana,
                    bonus_forca: heroi.bonus_forca,
                    bonus_protecao: heroi.bonus_protecao,
                    bonus_vitalidade: heroi.bonus_vitalidade,
                    bonus_inteligencia: heroi.bonus_inteligencia,
                    bonus_ataque_min: heroi.bonus_ataque_min,
                    bonus_ataque_max: heroi.bonus_ataque_max,
                    bonus_defesa_min: heroi.bonus_defesa_min,
                    bonus_defesa_max: heroi.bonus_defesa_max,
                    pontos_honra: heroi.pontos_honra
                })
            });
            
            if(updateResponse.ok) {
                console.log(`Recompensas entregues: ${experiencia} EXP, ${moedas} moedas e ${pontosHonra} pontos de honra`);
            } else {
                console.error('Falha ao atualizar status no servidor');
            }
        } else {
            console.error('Falha ao buscar status do herói');
        }
    } catch (error) {
        console.error('Erro ao entregar recompensa:', error);
    }
}

// Função para obter objetivo da missão
function getObjetivoMissao(missionId) {
    // Para a missão de infestação de Poring, o objetivo é derrotar 10 Poring
    switch(missionId) {
        case '1':
            return 10; // Derrotar 10 Poring
        default:
            return 10;
    }
}

// Função para obter nome da missão
function getNomeMissao(missionId) {
    switch(missionId) {
        case '1':
            return 'Infestação de Poring';
        default:
            return 'Missão Desconhecida';
    }
}

// Função para simular o progresso da missão (apenas para teste)
// Esta função seria chamada quando o jogador derrota um monstro
function simularDerrotaPoring() {
    const missoesAceitas = JSON.parse(localStorage.getItem('missoesAceitas') || '{}');
    
    // Verifica se a missão 1 está ativa
    if (missoesAceitas['1'] && missoesAceitas['1'].aceita) {
        atualizarProgressoMissao('1', 1);
    }
}

// Função para notificação de derrota de inimigo
// Esta função pode ser chamada de outras páginas do jogo
function notificarDerrotaInimigo(tipoInimigo) {
    console.log(`Notificação de derrota recebida para: ${tipoInimigo}`); // Debug
    
    // Se o tipo de inimigo for "poring" e a missão estiver ativa
    if (tipoInimigo.toLowerCase().includes('poring')) {
        const missoesAceitas = JSON.parse(localStorage.getItem('missoesAceitas') || '{}');
        
        // Verifica se a missão 1 está ativa
        if (missoesAceitas['1'] && missoesAceitas['1'].aceita) {
            console.log('Missão 1 está ativa, atualizando progresso...'); // Debug
            atualizarProgressoMissao('1', 1);
        } else {
            console.log('Missão 1 não está ativa'); // Debug
        }
    }
}

// Adiciona listener para atualizar a interface quando o localStorage for modificado em outra aba
window.addEventListener('storage', function(e) {
    if (e.key === 'missoesAceitas') {
        console.log('Atualizando interface devido a mudança em outra aba');
        // Recarrega o progresso das missões
        carregarProgressoMissoes();
    }
});

// Expondo a função para uso global (para testes ou integração com outras partes do jogo)
window.simularDerrotaPoring = simularDerrotaPoring;
window.notificarDerrotaInimigo = notificarDerrotaInimigo;
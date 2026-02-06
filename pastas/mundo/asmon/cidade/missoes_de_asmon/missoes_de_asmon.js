// Sistema de Missões para Asmon - Usando API do Servidor
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
    
    // Adiciona evento ao botão de atualizar manualmente
    const btnAtualizar = document.getElementById('btn-atualizar-missoes');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', function() {
            carregarProgressoMissoes();
            // Faz uma breve animação para indicar que está atualizando
            const originalText = btnAtualizar.textContent;
            btnAtualizar.textContent = 'Atualizando...';
            btnAtualizar.disabled = true;
            setTimeout(() => {
                btnAtualizar.textContent = originalText;
                btnAtualizar.disabled = false;
            }, 1000);
        });
    }
    
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
async function aceitarMissao(missionId) {
    // Verifica se o jogador já aceitou esta missão
    const progressoMissoes = await carregarProgressoMissoesAPI();
    if (progressoMissoes[missionId]) {
        alert('Você já aceitou esta missão!');
        return;
    }
    
    // Aceita a missão no servidor (inicia com progresso 0)
    try {
        await fetch('/api/progresso-missoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                missao_id: missionId,
                incremento: 0
            })
        });
        
        // Atualiza a interface
        atualizarInterfaceMissao(missionId);
        
        // Exibe mensagem de confirmação
        const nomeMissao = getNomeMissao(missionId);
        alert(`Missão "${nomeMissao}" aceita! Boa sorte na sua jornada.`);
    } catch (error) {
        console.error('Erro ao aceitar missão:', error);
        alert('Erro ao aceitar a missão.');
    }
}

// Função para completar uma missão
async function completarMissao(missionId) {
    const progressoMissoes = await carregarProgressoMissoesAPI();
    const missao = progressoMissoes[missionId];
    
    if (!missao || missao.progresso < getObjetivoMissao(missionId)) {
        alert('Você ainda não completou os objetivos desta missão!');
        return;
    }
    
    // Entrega recompensa
    await entregarRecompensa(missionId);
    
    // Atualiza a interface
    atualizarInterfaceMissao(missionId);
    
    // Exibe mensagem de conclusão
    const nomeMissao = getNomeMissao(missionId);
    alert(`Parabéns! Você completou a missão "${nomeMissao}" e recebeu sua recompensa.`);
}

// Função para desistir de uma missão
async function desistirMissao(missionId) {
    if (!confirm('Tem certeza que deseja desistir desta missão? Todo o progresso será perdido.')) {
        return;
    }
    
    // No nosso sistema, desistir basicamente ignora a missão
    // Podemos limpar o progresso ou marcar como inativa, mas por simplicidade vamos apenas atualizar a interface
    atualizarInterfaceMissao(missionId);
    
    // Exibe mensagem de confirmação
    const nomeMissao = getNomeMissao(missionId);
    alert(`Você desistiu da missão "${nomeMissao}". Poderá aceitá-la novamente quando quiser.`);
}

// Função para atualizar o progresso da missão (seria chamada ao derrotar um inimigo)
async function atualizarProgressoMissao(missionId, incremento = 1) {
    console.log(`Atualizando progresso da missão ${missionId}, incremento: ${incremento}`); // Debug
    
    try {
        const response = await fetch('/api/progresso-missoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                missao_id: missionId,
                incremento: incremento
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`Progresso atualizado: ${data.progresso}/${getObjetivoMissao(missionId)}`); // Debug
            
            // Atualiza a interface
            atualizarInterfaceMissao(missionId);
            
            // Verifica se a missão foi completada
            if (data.progresso >= getObjetivoMissao(missionId)) {
                mostrarBotaoConcluir(missionId);
            }
        } else {
            console.error('Erro ao atualizar progresso da missão:', response.statusText);
        }
    } catch (error) {
        console.error('Erro na atualização de progresso:', error);
    }
}

// Função para atualizar a interface da missão
async function atualizarInterfaceMissao(missionId) {
    const progressoMissoes = await carregarProgressoMissoesAPI();
    const missao = progressoMissoes[missionId];
    const objetivo = getObjetivoMissao(missionId);
    
    const progressElement = document.querySelector(`.progress-fill[data-mission="${missionId}"]`);
    const progressText = document.querySelector(`.progress-text[data-mission="${missionId}"]`);
    const acceptButton = document.querySelector(`.accept-mission[data-mission-id="${missionId}"]`);
    const completeButton = document.querySelector(`.complete-mission[data-mission-id="${missionId}"]`);
    const abandonButton = document.querySelector(`.abandon-mission[data-mission-id="${missionId}"]`);
    
    if (missao && missao.progresso < objetivo) {
        const percentual = (missao.progresso / objetivo) * 100;
        if (progressElement) {
            progressElement.style.width = `${percentual}%`;
        }
        if (progressText) {
            progressText.textContent = `${missao.progresso}/${objetivo} Poring derrotados`;
        }
        if (acceptButton) {
            acceptButton.style.display = 'none';
        }
        if (completeButton) {
            completeButton.style.display = 'none'; // Apenas mostra quando completar
        }
        if (abandonButton) {
            abandonButton.style.display = 'inline-block';
        }
    } else if (missao && missao.progresso >= objetivo) {
        // Missão completa
        const percentual = 100;
        if (progressElement) {
            progressElement.style.width = `${percentual}%`;
        }
        if (progressText) {
            progressText.textContent = `${objetivo}/${objetivo} Poring derrotados`;
        }
        if (acceptButton) {
            acceptButton.style.display = 'none';
        }
        if (completeButton) {
            completeButton.style.display = 'inline-block';
        }
        if (abandonButton) {
            abandonButton.style.display = 'none';
        }
    } else {
        // Se a missão não está ativa, resetar a interface
        if (progressElement) {
            progressElement.style.width = '0%';
        }
        if (progressText) {
            progressText.textContent = `0/${objetivo} Poring derrotados`;
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

// Função para carregar o progresso das missões do servidor
async function carregarProgressoMissoesAPI() {
    try {
        const response = await fetch('/api/progresso-missoes');
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Erro ao carregar progresso das missões:', response.statusText);
            return {};
        }
    } catch (error) {
        console.error('Erro na requisição de progresso das missões:', error);
        return {};
    }
}

// Função para carregar o progresso das missões
async function carregarProgressoMissoes() {
    const progressoMissoes = await carregarProgressoMissoesAPI();
    
    for (const missionId in progressoMissoes) {
        await atualizarInterfaceMissao(missionId);
        
        // Verifica se a missão está completa para mostrar o botão de concluir
        const missao = progressoMissoes[missionId];
        if (missao.progresso >= getObjetivoMissao(missionId)) {
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
        abandonButton.style.display = 'none'; // Oculta o botão de abandonar quando a missão está completa
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

// Função para notificação de derrota de inimigo
// Esta função pode ser chamada de outras páginas do jogo
async function notificarDerrotaInimigo(tipoInimigo) {
    console.log(`Notificação de derrota recebida para: ${tipoInimigo}`); // Debug
    
    // Se o tipo de inimigo for "poring" e a missão estiver ativa
    if (tipoInimigo.toLowerCase().includes('poring')) {
        // Verifica se a missão 1 está ativa
        const progressoMissoes = await carregarProgressoMissoesAPI();
        if (progressoMissoes['1']) {
            console.log('Missão 1 está ativa, atualizando progresso...'); // Debug
            await atualizarProgressoMissao('1', 1);
        } else {
            console.log('Missão 1 não está ativa'); // Debug
        }
    }
}

// Função para verificar derrotas de inimigos registradas em outras abas
async function verificarDerrotasRecentes() {
    try {
        const ultimaDerrotaStr = localStorage.getItem('ultimaDerrotaInimigo');
        if (ultimaDerrotaStr) {
            const ultimaDerrota = JSON.parse(ultimaDerrotaStr);
            // Verifica se a derrota é recente (nos últimos 10 segundos)
            if (Date.now() - ultimaDerrota.timestamp < 10000) {
                await notificarDerrotaInimigo(ultimaDerrota.tipo);
                // Limpa a notificação após processar
                localStorage.removeItem('ultimaDerrotaInimigo');
            }
        }
    } catch(e) {
        console.log("Erro ao verificar derrotas recentes:", e);
    }
}

// Atualiza o progresso periodicamente para manter sincronizado
setInterval(async function() {
    await carregarProgressoMissoes();
    await verificarDerrotasRecentes(); // Verifica se há derrotas registradas em outras abas
}, 2000); // Atualiza a cada 2 segundos para maior agilidade

// Expondo a função para uso global (para testes ou integração com outras partes do jogo)
window.notificarDerrotaInimigo = notificarDerrotaInimigo;
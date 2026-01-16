// inicio.js

document.addEventListener('DOMContentLoaded', () => {
    // Tenta renderizar os status após um pequeno delay para garantir que o DOM e outros scripts carregaram
    setTimeout(renderizarStatusInicio, 100); 
});

// =================================================================
// CONTROLE DO MENU LATERAL (SIDEBAR)
// =================================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('is-open'); 
    }
}
// Torna a função global para o HTML
window.toggleSidebar = toggleSidebar; 

// =================================================================
// CONTROLE DO WIDGET DE STATUS (ABRIR/FECHAR)
// =================================================================
function toggleHeroInfo() {
    const content = document.getElementById('hero-info-content'); 
    const icon = document.getElementById('hero-info-icon');      

    if (content && icon) {
        content.classList.toggle('is-expanded');

        if (content.classList.contains('is-expanded')) {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        } else {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right'); 
        }
    }
}
window.toggleHeroInfo = toggleHeroInfo; 

// =================================================================
// RENDERIZAÇÃO DOS STATUS NO INÍCIO
// =================================================================
function renderizarStatusInicio() {
    // Verifica se o objeto de status global existe (veio do status.js)
    if (typeof window.heroStatus === 'undefined') {
        console.warn("Aviso: HeroStatus não encontrado. Verifique se o status.js foi carregado.");
        return;
    }
    
    // Atualiza os dados (se as funções de cálculo existirem)
    if (typeof window.carregarStatus === 'function') window.carregarStatus();
    if (typeof window.calcularAtributosSecundarios === 'function') window.calcularAtributosSecundarios();
    
    const status = window.heroStatus;
    
    // Mapeamento dos elementos do HTML
    const elementos = {
        level: document.getElementById('inicio-level-valor'),
        exp: document.getElementById('inicio-exp-valor'),
        vida: document.getElementById('inicio-vida-valor'),
        mana: document.getElementById('inicio-mana-valor')
    };
    
    // Preenche os valores apenas se os elementos existirem na página
    if (elementos.level) elementos.level.textContent = status.level;
    if (elementos.exp)   elementos.exp.textContent   = `${status.exp} / ${status.expMax}`;
    if (elementos.vida)  elementos.vida.textContent  = `${status.vidaAtual} / ${status.vidaMaxima}`;
    if (elementos.mana)  elementos.mana.textContent  = `${status.manaAtual} / ${status.manaMaxima}`;
    
    console.log("✅ Status do Início atualizados com sucesso.");
}
window.renderizarStatusInicio = renderizarStatusInicio;
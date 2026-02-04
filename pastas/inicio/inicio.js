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

// Fecha a sidebar ao clicar fora dela
document.addEventListener('click', (event) => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    // Se o menu estiver aberto E o clique NÃO for na sidebar E NÃO for no botão de abrir o menu
    if (sidebar && sidebar.classList.contains('is-open')) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('is-open');
        }
    }
});

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
    const status = window.heroStatus;

    // Se o objeto estiver vazio, não faz nada ainda
    if (!status || Object.keys(status).length === 0) return;

    // Seleção dos elementos (ID's que estão no seu HTML do início)
    const elLevel = document.getElementById('inicio-level-valor');
    const elExp   = document.getElementById('inicio-exp-valor');
    const elVida  = document.getElementById('inicio-vida-valor');
    const elMana  = document.getElementById('inicio-mana-valor');

    // Preenchimento usando os nomes das colunas do seu Banco de Dados
    if (elLevel) elLevel.textContent = status.nivel;
    if (elExp)   elExp.textContent   = `${status.exp} / ${status.exp_max}`;
    if (elVida)  elVida.textContent  = `${status.vida_atual} / ${status.vida_maxima}`;
    if (elMana)  elMana.textContent  = `${status.mana_atual} / ${status.mana_maxima}`;

    console.log("✅ Widget de Status atualizado com dados do banco.");
}
window.renderizarStatusInicio = renderizarStatusInicio;
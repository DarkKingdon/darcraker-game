// mundo.js

document.addEventListener('DOMContentLoaded', () => {
    carregarStatusMundo();
});

let heroLevel = 1;

async function carregarStatusMundo() {
    try {
        const res = await fetch('/api/status');
        const status = await res.json();
        heroLevel = status.nivel;
        
        atualizarBloqueios();
    } catch (e) {
        console.error("Erro ao carregar status no mundo:", e);
    }
}

function atualizarBloqueios() {
    const zonas = document.querySelectorAll('.zone-card');
    
    zonas.forEach(zona => {
        const minLevel = parseInt(zona.getAttribute('data-min-level'));
        const btn = zona.querySelector('.enter-btn');
        
        if (heroLevel < minLevel) {
            zona.classList.add('locked');
            if (btn) {
                btn.textContent = `Bloqueado (Nv. ${minLevel})`;
                btn.onclick = (e) => {
                    e.preventDefault();
                    alert(`Você precisa ser nível ${minLevel} para acessar esta área!`);
                };
            }
        } else {
            zona.classList.remove('locked');
        }
    });
}

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

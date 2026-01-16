// heroi.js completo e atualizado
document.addEventListener('DOMContentLoaded', () => {
    console.log("Página do Herói carregada.");
});

// Controle da Sidebar (Global para o HTML encontrar)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('is-open');
    }
}
window.toggleSidebar = toggleSidebar;

// Controle das Profissões
function toggleProfessions() {
    const content = document.getElementById('professions-content');
    const icon = document.getElementById('professions-toggle-icon');
    
    if (content && icon) {
        content.classList.toggle('is-open'); 
        
        if (content.classList.contains('is-open')) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }
}
window.toggleProfessions = toggleProfessions;
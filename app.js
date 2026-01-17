const express = require('express');
const db = require('./db'); 
const path = require('path');
const session = require('express-session');
const app = express();

// --- 1. CONFIGURAÇÕES ---
app.use(session({
    secret: 'minha-chave-secreta',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 2. ARQUIVOS ESTÁTICOS ---
// Libera a raiz (login, cadastro)
app.use(express.static(__dirname)); 

// Libera a pasta 'pastas' para arquivos CSS/JS/HTML internos
// O middleware verifica se o usuário está logado antes de permitir o acesso
app.use('/pastas', (req, res, next) => {
    if (req.session.logado) {
        next();
    } else {
        res.redirect('/login.html');
    }
}, express.static(path.join(__dirname, 'pastas')));

// --- 3. ROTAS DE API (STATUS) ---

app.get('/api/status', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: "Não autorizado" });
    
    try {
        const [rows] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [req.session.usuarioId]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ erro: "Status não encontrados" });
        }
    } catch (err) {
        res.status(500).json({ erro: "Erro interno" });
    }
});

app.post('/api/status', async (req, res) => {
    if (!req.session.logado) return res.status(401).send("Não autorizado");
    const s = req.body;
    try {
        await db.query(
            `UPDATE heroi_status SET 
            forca=?, protecao=?, vitalidade=?, inteligencia=?, pontos_disponiveis=?, 
            vida_atual=?, mana_atual=?, vida_maxima=?, mana_maxima=? 
            WHERE usuario_id = ?`,
            [s.forca, s.protecao, s.vitalidade, s.inteligencia, s.pontos_disponiveis, 
             s.vida_atual, s.mana_atual, s.vida_maxima, s.mana_maxima, req.session.usuarioId]
        );
        res.send("OK");
    } catch (err) {
        res.status(500).send("Erro ao salvar");
    }
});

// --- 4. LOGIN E CADASTRO ---
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const [user] = await db.query('SELECT * FROM usuarios WHERE email=? AND senha=?', [email, senha]);
    if (user.length > 0) {
        req.session.logado = true;
        req.session.usuarioId = user[0].id;
        res.redirect('/pastas/inicio/inicio.html');
    } else {
        res.send("<script>alert('Falha'); window.location='/login.html';</script>");
    }
});

app.get('/sair', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

app.listen(process.env.PORT || 3000);
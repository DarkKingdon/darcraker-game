const express = require('express');
const db = require('./db'); 
const path = require('path');
const session = require('express-session');
const app = express();

// 1. Configuração de Sessão
app.use(session({
    secret: 'minha-chave-secreta',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

function verificarLogado(req, res, next) {
    if (req.session.logado) {
        return next();
    }
    res.redirect('/login.html');
}

// 2. SERVINDO ARQUIVOS ESTÁTICOS (CORREÇÃO DO ERRO DE CSS/JS)
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/pastas/img', express.static(path.join(__dirname, 'pastas', 'img')));

// Essa linha resolve o erro de MIME type do Status:
app.use(express.static(path.join(__dirname, 'pastas/heroi/status')));
// Essa linha resolve o erro de MIME type do Combate:
app.use(express.static(path.join(__dirname, 'pastas/combate')));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// 3. ROTAS DE NAVEGAÇÃO
app.get('/inicio.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'inicio', 'inicio.html'));
});

app.get('/heroi.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'heroi.html'));
});

app.get('/status.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'status', 'status.html'));
});

// 4. API DE STATUS (UNIFICADA E COMPLETA)
app.get('/api/status', verificarLogado, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [req.session.usuarioId]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            await db.query('INSERT INTO heroi_status (usuario_id) VALUES (?)', [req.session.usuarioId]);
            const [novo] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [req.session.usuarioId]);
            res.json(novo[0]);
        }
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar status" });
    }
});

app.post('/api/status', verificarLogado, async (req, res) => {
    const s = req.body;
    // INCLUÍDO: nivel, exp e exp_max para salvar o progresso do Orlos
    const query = `UPDATE heroi_status SET 
        nivel=?, exp=?, exp_max=?, pontos_disponiveis=?, 
        forca=?, protecao=?, vitalidade=?, inteligencia=?, 
        vida_atual=?, mana_atual=?, vida_maxima=?, mana_maxima=? 
        WHERE usuario_id=?`;
    
    try {
        await db.query(query, [
            s.nivel, s.exp, s.exp_max, s.pontos_disponiveis, 
            s.forca, s.protecao, s.vitalidade, s.inteligencia, 
            s.vida_atual, s.mana_atual, s.vida_maxima, s.mana_maxima,
            req.session.usuarioId
        ]);
        res.json({ sucesso: true, mensagem: "Status e XP salvos!" });
    } catch (err) {
        console.error("Erro ao salvar:", err);
        res.status(500).json({ erro: "Erro ao salvar no banco" });
    }
});

// 5. MONSTROS
app.get('/api/monstro/:nome', verificarLogado, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM monstros WHERE nome = ?', [req.params.nome]);
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ erro: "Monstro não encontrado" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar monstro" });
    }
});

// 6. LOGIN / CADASTRO / SAIR
app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const [result] = await db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, senha]);
        await db.query('INSERT INTO heroi_status (usuario_id) VALUES (?)', [result.insertId]);
        res.send("<script>alert('Sucesso!'); window.location='/login.html';</script>");
    } catch (err) { res.status(500).send("Erro ao cadastrar"); }
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ? AND senha = ?', [email, senha]);
        if (usuarios.length > 0) {
            req.session.logado = true;
            req.session.usuarioId = usuarios[0].id;
            res.redirect('/inicio.html'); 
        } else {
            res.send("<script>alert('Login incorreto!'); window.location='/login.html';</script>");
        }
    } catch (err) { res.status(500).send("Erro no banco"); }
});

app.get('/sair', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));
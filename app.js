const express = require('express');
const db = require('./db'); 
const path = require('path');
const session = require('express-session');
const app = express();

// --- 1. CONFIGURAÇÕES INICIAIS ---
app.use(session({
    secret: 'minha-chave-secreta',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hora
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 2. ARQUIVOS PÚBLICOS ---
app.use(express.static(__dirname)); 
app.use('/pastas/img', express.static(path.join(__dirname, 'pastas', 'img')));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// --- 3. ROTAS DE API (STATUS DO HERÓI) ---

// Busca os status do herói logado
app.get('/api/status', async (req, res) => {
    if (!req.session.logado) {
        return res.status(401).json({ erro: "Não autorizado" });
    }
    try {
        const [rows] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [req.session.usuarioId]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ erro: "Status não encontrados" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar status" });
    }
});

// Salva os status atualizados
app.post('/api/status', async (req, res) => {
    if (!req.session.logado) return res.status(401).send("Não autorizado");

    const { forca, protecao, vitalidade, inteligencia, pontos_disponiveis, vida_atual, mana_atual } = req.body;
    
    try {
        await db.query(
            `UPDATE heroi_status SET 
            forca = ?, protecao = ?, vitalidade = ?, inteligencia = ?, 
            pontos_disponiveis = ?, vida_atual = ?, mana_atual = ?
            WHERE usuario_id = ?`,
            [forca, protecao, vitalidade, inteligencia, pontos_disponiveis, vida_atual, mana_atual, req.session.usuarioId]
        );
        res.send("Salvo com sucesso");
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao salvar");
    }
});

// --- 4. ROTAS DE AUTENTICAÇÃO ---

app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const [result] = await db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, senha]);
        const novoUsuarioId = result.insertId;
        // Cria o registro inicial de status para o novo herói
        await db.query('INSERT INTO heroi_status (usuario_id) VALUES (?)', [novoUsuarioId]);
        res.send("<script>alert('Sucesso!'); window.location='/login.html';</script>");
    } catch (err) {
        res.status(500).send("Erro ao cadastrar");
    }
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
    } catch (err) {
        res.status(500).send("Erro no banco");
    }
});

app.get('/sair', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
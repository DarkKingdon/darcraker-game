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

// --- 2. ARQUIVOS PÚBLICOS (ACESSO LIVRE) ---

// Libera os arquivos da raiz (login.html, cadastro.html, login.css, cadastro.css)
app.use(express.static(__dirname)); 

// Libera a subpasta de imagens para que o fundo apareça no login/cadastro
app.use('/pastas/img', express.static(path.join(__dirname, 'pastas', 'img')));

// Rota raiz redireciona para o login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// --- 3. SEGURANÇA E BLOQUEIO DA PASTA /pastas ---

// Middleware de proteção: impede acesso a /pastas sem estar logado
const verificarLogado = (req, res, next) => {
    if (req.session.logado) {
        return next();
    } else {
        res.redirect('/login.html');
    }
};

// Aplica a proteção em tudo que estiver dentro de /pastas (exceto o que já liberamos acima)
app.use('/pastas', verificarLogado, express.static(path.join(__dirname, 'pastas')));


// --- 4. ROTAS DE NAVEGAÇÃO DAS PÁGINAS ---

app.get('/inicio.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'inicio', 'inicio.html'));
});

app.get('/heroi.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'heroi.html'));
});

app.get('/status.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'status.html'));
});


// --- 5. API DO HERÓI (INTERAÇÃO COM O BANCO) ---

app.get('/api/status', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: "Não autorizado" });
    try {
        const [rows] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [req.session.usuarioId]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            // Se por algum motivo não tiver status, cria um novo
            await db.query('INSERT INTO heroi_status (usuario_id) VALUES (?)', [req.session.usuarioId]);
            const [novo] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [req.session.usuarioId]);
            res.json(novo[0]);
        }
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar status" });
    }
});

app.post('/api/status/salvar', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: "Não autorizado" });
    const s = req.body;
    const query = `UPDATE heroi_status SET 
        nivel=?, exp=?, pontos_disponiveis=?, pontos_maestria=?, 
        forca=?, protecao=?, vitalidade=?, inteligencia=?, 
        vida_atual=?, mana_atual=?,
        ataque_min=?, ataque_max=?, defesa_min=?, defesa_max=?, 
        vida_maxima=?, mana_maxima=? 
        WHERE usuario_id=?`;
    
    try {
        await db.query(query, [
            s.level, s.exp, s.pontosDisponiveis, s.pontosMaestria, 
            s.forca, s.protecao, s.vitalidade, s.inteligencia, 
            s.vidaAtual, s.manaAtual,
            s.ataqueMin, s.ataqueMax, s.defesaMin, s.defesaMax,
            s.vidaMaxima, s.manaMaxima,
            req.session.usuarioId
        ]);
        res.json({ mensagem: "Sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao salvar" });
    }
});


// --- 6. SISTEMA DE USUÁRIOS (LOGIN E CADASTRO) ---

app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const [existente] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) {
            return res.send("<script>alert('Este e-mail já está cadastrado!'); window.location='/cadastro.html';</script>");
        }
        const [result] = await db.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', 
            [nome, email, senha]
        );
        const novoUsuarioId = result.insertId;
        // Cria o herói inicial no banco
        await db.query('INSERT INTO heroi_status (usuario_id) VALUES (?)', [novoUsuarioId]);
        res.send("<script>alert('Cadastro realizado com sucesso!'); window.location='/login.html';</script>");
    } catch (err) {
        console.error("Erro ao cadastrar:", err);
        res.status(500).send("Erro interno ao tentar cadastrar.");
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
        res.status(500).send("Erro no banco de dados.");
    }
});

app.get('/sair', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// --- 7. INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
});
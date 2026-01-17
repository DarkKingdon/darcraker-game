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

// --- 2. ARQUIVOS PÚBLICOS (PASTA PUBLIC) ---

// ESSA É A CORREÇÃO PRINCIPAL:
// Indica que arquivos como login.html estão dentro da pasta 'public'
app.use(express.static(path.join(__dirname, 'public'))); 

// Libera a subpasta de imagens para que o fundo apareça no login/cadastro
// (Assumindo que 'pastas' está na raiz do projeto)
app.use('/pastas/img', express.static(path.join(__dirname, 'pastas', 'img')));

// Rota raiz: Envia o login.html que está dentro de 'public'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// --- 3. SEGURANÇA E BLOQUEIO DA PASTA /pastas ---

const verificarLogado = (req, res, next) => {
    if (req.session.logado) {
        return next();
    } else {
        // Se não estiver logado, volta para o login na raiz
        res.redirect('/login.html');
    }
};

// Protege a pasta /pastas
app.use('/pastas', verificarLogado, express.static(path.join(__dirname, 'pastas')));


// --- 4. ROTAS DE NAVEGAÇÃO ---

app.get('/inicio.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'inicio', 'inicio.html'));
});

app.get('/heroi.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'heroi.html'));
});

app.get('/status.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'status.html'));
});


// --- 5. API E SISTEMA DE USUÁRIOS ---

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
        await db.query('INSERT INTO heroi_status (usuario_id) VALUES (?)', [novoUsuarioId]);
        res.send("<script>alert('Cadastro realizado com sucesso!'); window.location='/login.html';</script>");
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao cadastrar.");
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
        res.status(500).send("Erro no servidor.");
    }
});

app.get('/sair', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// --- 6. INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
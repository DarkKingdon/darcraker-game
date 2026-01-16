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
    cookie: { maxAge: 3600000 } // 1 hora
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 2. ARQUIVOS PÚBLICOS
app.use(express.static('public')); 

// 3. BLOQUEIO DA PASTA /pastas (Acesso apenas se logado)
app.use('/pastas', (req, res, next) => {
    if (req.session.logado) {
        next();
    } else {
        res.redirect('/login.html');
    }
}, express.static(path.join(__dirname, 'pastas')));

// --- 4. ROTAS DE NAVEGAÇÃO (Páginas protegidas) ---

app.get('/inicio.html', (req, res) => {
    if (req.session.logado) {
        res.sendFile(path.join(__dirname, 'pastas', 'inicio', 'inicio.html'));
    } else {
        res.redirect('/login.html');
    }
});

// Adicionei esta de volta, que é necessária para abrir a página do herói
app.get('/heroi.html', (req, res) => {
    if (req.session.logado) {
        res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'heroi.html'));
    } else {
        res.redirect('/login.html');
    }
});

// Rota para a página de status (dentro da pasta heroi ou onde você a colocou)
app.get('/status.html', (req, res) => {
    if (req.session.logado) {
        // Ajuste o caminho abaixo conforme a pasta real onde o status.html está
        res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'status.html'));
    } else {
        res.redirect('/login.html');
    }
});

// --- 5. API DE STATUS (Interação com Banco) ---

app.get('/api/status', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: "Não autorizado" });
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

app.post('/api/status/salvar', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: "Não autorizado" });
    const s = req.body;
    // Adicionamos os novos campos na Query de UPDATE
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

// --- 6. LOGIN E CADASTRO ---

// --- ROTA DE CADASTRO ---
app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        // 1. Verifica se o e-mail já existe para não duplicar
        const [existente] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        
        if (existente.length > 0) {
            return res.send("<script>alert('Este e-mail já está cadastrado!'); window.location='/cadastro.html';</script>");
        }

        // 2. Insere o novo usuário na tabela 'usuarios'
        const [result] = await db.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', 
            [nome, email, senha]
        );

        const novoUsuarioId = result.insertId;

        // 3. CRUCIAL: Cria a linha de status inicial para o herói desse usuário
        // Sem isso, o herói não existirá no banco quando ele logar!
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
        res.status(500).send("Erro no banco");
    }
});

app.get('/sair', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
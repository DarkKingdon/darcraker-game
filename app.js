const express = require('express');
const db = require('./db'); 
const path = require('path');
const session = require('express-session');
const app = express();

// 1. Configuração de Sessão (MANTIDO)
app.use(session({
    secret: 'minha-chave-secreta',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- FUNÇÃO QUE ESTAVA FALTANDO (ADICIONADO PARA CORRIGIR O ERRO) ---
function verificarLogado(req, res, next) {
    if (req.session.logado) {
        return next();
    }
    res.redirect('/login.html');
}

// 2. ARQUIVOS PÚBLICOS (MANTIDO)
app.use(express.static(path.join(__dirname, 'public'))); 

// Liberação da imagem de fundo (MANTIDO)
app.use('/pastas/img', express.static(path.join(__dirname, 'pastas', 'img')));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// 3. BLOQUEIO DA PASTA /pastas (MANTIDO E CORRIGIDO)
app.use('/pastas', verificarLogado, express.static(path.join(__dirname, 'pastas')));


// --- 4. ROTAS DE NAVEGAÇÃO (MANTIDO) ---

app.get('/inicio.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'inicio', 'inicio.html'));
});

app.get('/heroi.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'heroi.html'));
});

app.get('/status.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'status', 'status.html'));
});

// --- 5. API DE STATUS (SINCRONIZADA COM SEU SQL) ---

app.get('/api/status', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: "Não autorizado" });
    try {
        const [rows] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [req.session.usuarioId]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            // Cria registro caso não exista (MANTIDO)
            await db.query('INSERT INTO heroi_status (usuario_id) VALUES (?)', [req.session.usuarioId]);
            const [novo] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [req.session.usuarioId]);
            res.json(novo[0]);
        }
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar status" });
    }
});

app.post('/api/status', async (req, res) => {
    if (!req.session.logado) return res.status(401).json({ erro: "Não autorizado" });
    
    const s = req.body;
    // Nomes das colunas batendo com seu arquivo SQL (CORRIGIDO)
    const query = `UPDATE heroi_status SET 
        nivel=?, exp=?, pontos_disponiveis=?, 
        forca=?, protecao=?, vitalidade=?, inteligencia=?, 
        vida_atual=?, mana_atual=?, vida_maxima=?, mana_maxima=? 
        WHERE usuario_id=?`;
    
    try {
        await db.query(query, [
            s.nivel, s.exp, s.pontos_disponiveis, 
            s.forca, s.protecao, s.vitalidade, s.inteligencia, 
            s.vida_atual, s.mana_atual, s.vida_maxima, s.mana_maxima,
            req.session.usuarioId
        ]);
        res.json({ mensagem: "Sucesso" });
    } catch (err) {
        console.error("Erro ao salvar:", err);
        res.status(500).json({ erro: "Erro ao salvar" });
    }
});

// --- 6. LOGIN E CADASTRO (MANTIDO) ---

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
        // Cria o herói no banco junto com o usuário (MANTIDO)
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


// Rota para o JS do Herói buscar os dados do banco
app.get('/api/status', verificarLogado, async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId;
        const [rows] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [usuarioId]);
        
        if (rows.length > 0) {
            res.json(rows[0]); // Envia os dados do herói (vida, mana, forca, etc)
        } else {
            res.status(404).json({ erro: "Status não encontrado" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro no servidor" });
    }
});

// Rota para fornecer os dados do herói ao status.js
app.get('/api/status', verificarLogado, async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId;
        // Busca na tabela heroi_status usando o ID da sessão
        const [rows] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [usuarioId]);
        
        if (rows.length > 0) {
            res.json(rows[0]); // Retorna nível, vida, mana, etc.
        } else {
            res.status(404).json({ erro: "Personagem não encontrado" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
});

// Rota para salvar os pontos distribuídos
app.post('/api/status', verificarLogado, async (req, res) => {
    try {
        const { forca, protecao, vitalidade, inteligencia, pontos_disponiveis, vida_maxima, mana_maxima, vida_atual, mana_atual } = req.body;
        const usuarioId = req.session.usuarioId;

        await db.query(
            `UPDATE heroi_status SET 
            forca = ?, protecao = ?, vitalidade = ?, inteligencia = ?, 
            pontos_disponiveis = ?, vida_maxima = ?, mana_maxima = ?, 
            vida_atual = ?, mana_atual = ? 
            WHERE usuario_id = ?`,
            [forca, protecao, vitalidade, inteligencia, pontos_disponiveis, vida_maxima, mana_maxima, vida_atual, mana_atual, usuarioId]
        );
        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao salvar status" });
    }
});

// Porta do Railway (MANTIDO)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
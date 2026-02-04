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
    if (req.session && req.session.logado) {
        return next();
    }
    // Se for uma chamada de API (JSON), não redireciona, apenas avisa que não está logado
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ erro: "Sessão expirada. Faça login novamente." });
    }
    res.redirect('/login.html');
}

app.use('/pastas/img', express.static(path.join(__dirname, 'pastas', 'img')));
app.use(express.static(path.join(__dirname, 'public'))); 

// Protege todos os arquivos dentro de /pastas exigindo login
app.use('/pastas', verificarLogado, express.static(path.join(__dirname, 'pastas')));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// 3. Rotas de Navegação
app.get('/inicio.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'inicio', 'inicio.html'));
});

app.get('/heroi.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'heroi.html'));
});

app.get('/status.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'heroi', 'status', 'status.html'));
});

app.get('/mundo.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'mundo', 'mundo.html'));
});

app.get('/mochila.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'mochila', 'mochila.html'));
});

app.get('/rank.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'rank', 'rank.html'));
});

app.get('/mercado.html', verificarLogado, (req, res) => {
    res.sendFile(path.join(__dirname, 'pastas', 'mercado', 'mercado.html'));
});

app.get('/api/status', verificarLogado, async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId;
        console.log(`[DEBUG] Buscando status para usuario_id: ${usuarioId}`);

        const [rows] = await db.query(`
            SELECT h.*, i.nome as peito_nome, i.imagem_url as peito_img, 
                   i.defesa as peito_defesa, i.nivel_requerido as peito_nivel_req, 
                   i.protecao_requerida as peito_prot_req
            FROM heroi_status h
            LEFT JOIN itens i ON h.equip_peito = i.id
            WHERE h.usuario_id = ?
        `, [usuarioId]);
        
        if (rows.length > 0) {
            console.log(`[DEBUG] Dados encontrados: Level ${rows[0].nivel}`);
            res.json(rows[0]);
        } else {
            console.log(`[DEBUG] Herói não encontrado. Criando novo...`);
            await db.query('INSERT INTO heroi_status (usuario_id) VALUES (?)', [usuarioId]);
            const [novo] = await db.query('SELECT * FROM heroi_status WHERE usuario_id = ?', [usuarioId]);
            res.json(novo[0]);
        }
    } catch (err) {
        console.error("[ERRO SQL] /api/status:", err);
        res.status(500).json({ 
            erro: "Erro ao buscar status", 
            detalhe: err.message,
            sqlState: err.sqlState 
        });
    }
});

app.post('/api/equipamentos/equipar', verificarLogado, async (req, res) => {
    const { item_id, slot } = req.body; // slot: 'peito'
    const usuarioId = req.session.usuarioId;

    try {
        // 1. Verifica se o item está no inventário
        const [inv] = await db.query('SELECT quantidade FROM inventario WHERE usuario_id = ? AND item_id = ?', [usuarioId, item_id]);
        if (!inv.length || inv[0].quantidade <= 0) {
            return res.status(400).json({ erro: "Item não encontrado no inventário." });
        }

        // 2. Se já houver algo equipado, devolve para a mochila
        const campoEquip = `equip_${slot}`;
        const [heroi] = await db.query(`SELECT ${campoEquip} FROM heroi_status WHERE usuario_id = ?`, [usuarioId]);
        const itemAntigoId = heroi[0][campoEquip];

        if (itemAntigoId) {
            await db.query(
                'INSERT INTO inventario (usuario_id, item_id, quantidade) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantidade = quantidade + 1',
                [usuarioId, itemAntigoId]
            );
        }

        // 3. Equipa o novo e remove 1 do inventário
        await db.query(`UPDATE heroi_status SET ${campoEquip} = ? WHERE usuario_id = ?`, [item_id, usuarioId]);
        await db.query('UPDATE inventario SET quantidade = quantidade - 1 WHERE usuario_id = ? AND item_id = ?', [usuarioId, item_id]);
        await db.query('DELETE FROM inventario WHERE usuario_id = ? AND item_id = ? AND quantidade <= 0', [usuarioId, item_id]);

        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao equipar item." });
    }
});

app.post('/api/equipamentos/desequipar', verificarLogado, async (req, res) => {
    const { slot } = req.body;
    const usuarioId = req.session.usuarioId;

    try {
        const campoEquip = `equip_${slot}`;
        const [heroi] = await db.query(`SELECT ${campoEquip} FROM heroi_status WHERE usuario_id = ?`, [usuarioId]);
        const itemId = heroi[0][campoEquip];

        if (itemId) {
            await db.query(
                'INSERT INTO inventario (usuario_id, item_id, quantidade) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantidade = quantidade + 1',
                [usuarioId, itemId]
            );
            await db.query(`UPDATE heroi_status SET ${campoEquip} = NULL WHERE usuario_id = ?`, [usuarioId]);
        }

        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao desequipar item." });
    }
});

app.post('/api/status', verificarLogado, async (req, res) => {
    try {
        const { 
            nivel, exp, exp_max, 
            forca, protecao, vitalidade, inteligencia, 
            pontos_disponiveis, pontos_maestria,
            vida_maxima, mana_maxima, vida_atual, mana_atual,
            ataque_min, ataque_max, defesa_min, defesa_max,
            // NOVOS CAMPOS DE BÔNUS
            bonus_vida, bonus_mana, 
            bonus_forca, bonus_protecao, bonus_vitalidade, bonus_inteligencia,
            bonus_ataque_min, bonus_ataque_max, bonus_defesa_min, bonus_defesa_max
        } = req.body;
        
        const usuarioId = req.session.usuarioId;

        await db.query(
            `UPDATE heroi_status SET 
            nivel = ?, exp = ?, exp_max = ?, 
            forca = ?, protecao = ?, vitalidade = ?, inteligencia = ?, 
            pontos_disponiveis = ?, pontos_maestria = ?,
            vida_maxima = ?, mana_maxima = ?, vida_atual = ?, mana_atual = ?,
            ataque_min = ?, ataque_max = ?, defesa_min = ?, defesa_max = ?,
            bonus_vida = ?, bonus_mana = ?, 
            bonus_forca = ?, bonus_protecao = ?, bonus_vitalidade = ?, bonus_inteligencia = ?,
            bonus_ataque_min = ?, bonus_ataque_max = ?, bonus_defesa_min = ?, bonus_defesa_max = ?
            WHERE usuario_id = ?`,
            [
                nivel, exp, exp_max, 
                forca, protecao, vitalidade, inteligencia, 
                pontos_disponiveis, pontos_maestria,
                vida_maxima, mana_maxima, vida_atual, mana_atual,
                ataque_min, ataque_max, defesa_min, defesa_max,
                bonus_vida, bonus_mana, 
                bonus_forca, bonus_protecao, bonus_vitalidade, bonus_inteligencia,
                bonus_ataque_min, bonus_ataque_max, bonus_defesa_min, bonus_defesa_max,
                usuarioId
            ]
        );
        res.json({ sucesso: true });
    } catch (err) {
        console.error("Erro ao salvar status:", err);
        res.status(500).json({ erro: "Erro ao salvar progresso" });
    }
});

// 5. API de Monstros
app.get('/api/monstro/:nome', verificarLogado, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM monstros WHERE nome = ?', [req.params.nome]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ erro: "Monstro não encontrado" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar monstro" });
    }
});

// 6. API do Inventário
app.get('/api/inventario', verificarLogado, async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId;
        const [rows] = await db.query(
            `SELECT i.id as item_id, i.nome, i.descricao, i.imagem_url, i.tipo, inv.quantidade,
                    i.defesa, i.nivel_requerido, i.protecao_requerida
             FROM inventario inv 
             JOIN itens i ON inv.item_id = i.id 
             WHERE inv.usuario_id = ?`,
            [usuarioId]
        );
        res.json(rows);
    } catch (err) {
        console.error("Erro ao buscar inventário:", err);
        res.status(500).json({ erro: "Erro ao buscar inventário" });
    }
});

app.post('/api/inventario/adicionar', verificarLogado, async (req, res) => {
    try {
        const { item_id, quantidade } = req.body;
        const usuarioId = req.session.usuarioId;

        await db.query(
            `INSERT INTO inventario (usuario_id, item_id, quantidade) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`,
            [usuarioId, item_id, quantidade || 1, quantidade || 1]
        );
        
        res.json({ sucesso: true });
    } catch (err) {
        console.error("Erro ao adicionar item ao inventário:", err);
        res.status(500).json({ erro: "Erro ao salvar item" });
    }
});

// 7. API de Ranking
app.get('/api/rank', verificarLogado, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.nome, h.nivel, h.exp, h.exp_max 
             FROM usuarios u 
             JOIN heroi_status h ON u.id = h.usuario_id 
             ORDER BY h.nivel DESC, h.exp DESC 
             LIMIT 10`
        );
        res.json(rows);
    } catch (err) {
        console.error("Erro ao buscar ranking:", err);
        res.status(500).json({ erro: "Erro ao buscar ranking" });
    }
});

// 8. API de Mercado (Vendas P2P)
app.get('/api/mercado', verificarLogado, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.id as venda_id, u.nome as vendedor, i.nome as item_nome, i.imagem_url, m.quantidade, m.preco, m.item_id 
             FROM mercado m 
             JOIN usuarios u ON m.vendedor_id = u.id 
             JOIN itens i ON m.item_id = i.id 
             ORDER BY m.data_postagem DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao carregar mercado" });
    }
});

app.get('/api/mercado/meus-anuncios', verificarLogado, async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId;
        const [rows] = await db.query(
            `SELECT m.id as venda_id, i.nome as item_nome, i.imagem_url, m.quantidade, m.preco, m.item_id 
             FROM mercado m 
             JOIN itens i ON m.item_id = i.id 
             WHERE m.vendedor_id = ? 
             ORDER BY m.data_postagem DESC`,
            [usuarioId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao carregar seus anúncios" });
    }
});

app.post('/api/mercado/vender', verificarLogado, async (req, res) => {
    const { item_id, quantidade, preco } = req.body;
    const vendedorId = req.session.usuarioId;

    try {
        // Limite de 10 itens
        const [contagem] = await db.query('SELECT COUNT(*) as total FROM mercado WHERE vendedor_id = ?', [vendedorId]);
        if (contagem[0].total >= 10) {
            return res.status(400).json({ erro: "Você já atingiu o limite de 10 itens no mercado." });
        }

        const [inv] = await db.query(
            'SELECT quantidade FROM inventario WHERE usuario_id = ? AND item_id = ?',
            [vendedorId, item_id]
        );

        if (!inv.length || inv[0].quantidade < quantidade) {
            return res.status(400).json({ erro: "Quantidade insuficiente na mochila." });
        }

        await db.query(
            'UPDATE inventario SET quantidade = quantidade - ? WHERE usuario_id = ? AND item_id = ?',
            [quantidade, vendedorId, item_id]
        );

        await db.query('DELETE FROM inventario WHERE usuario_id = ? AND item_id = ? AND quantidade <= 0', [vendedorId, item_id]);

        await db.query(
            'INSERT INTO mercado (vendedor_id, item_id, quantidade, preco) VALUES (?, ?, ?, ?)',
            [vendedorId, item_id, quantidade, preco]
        );

        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao registrar venda." });
    }
});

app.post('/api/mercado/cancelar', verificarLogado, async (req, res) => {
    const { venda_id } = req.body;
    const usuarioId = req.session.usuarioId;

    try {
        const [venda] = await db.query('SELECT * FROM mercado WHERE id = ? AND vendedor_id = ?', [venda_id, usuarioId]);
        if (!venda.length) return res.status(404).json({ erro: "Anúncio não encontrado." });

        const { item_id, quantidade } = venda[0];

        // Devolve para o inventário
        await db.query(
            `INSERT INTO inventario (usuario_id, item_id, quantidade) VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`,
            [usuarioId, item_id, quantidade, quantidade]
        );

        // Remove do mercado
        await db.query('DELETE FROM mercado WHERE id = ?', [venda_id]);

        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cancelar anúncio." });
    }
});

app.post('/api/mercado/comprar', verificarLogado, async (req, res) => {
    const { venda_id } = req.body;
    const compradorId = req.session.usuarioId;

    try {
        const [venda] = await db.query('SELECT * FROM mercado WHERE id = ?', [venda_id]);
        if (!venda.length) return res.status(404).json({ erro: "Venda não encontrada." });

        const { vendedor_id, item_id, quantidade, preco } = venda[0];
        if (vendedor_id === compradorId) return res.status(400).json({ erro: "Você não pode comprar seu próprio item." });

        const [moedas] = await db.query(
            'SELECT quantidade FROM inventario WHERE usuario_id = ? AND item_id = 1',
            [compradorId]
        );

        if (!moedas.length || moedas[0].quantidade < preco) {
            return res.status(400).json({ erro: "Moedas insuficientes." });
        }

        await db.query('UPDATE inventario SET quantidade = quantidade - ? WHERE usuario_id = ? AND item_id = 1', [preco, compradorId]);
        
        await db.query(
            `INSERT INTO inventario (usuario_id, item_id, quantidade) VALUES (?, 1, ?) 
             ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`,
            [vendedor_id, preco, preco]
        );

        await db.query(
            `INSERT INTO inventario (usuario_id, item_id, quantidade) VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE quantidade = quantidade + ?`,
            [compradorId, item_id, quantidade, quantidade]
        );

        await db.query('DELETE FROM mercado WHERE id = ?', [venda_id]);

        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao processar compra." });
    }
});

// 9. Autenticação (Login/Cadastro)
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
        console.error(err);
        res.status(500).send("Erro no banco");
    }
});

app.get('/sair', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
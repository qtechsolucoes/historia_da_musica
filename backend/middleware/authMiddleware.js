// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Obter o token do cabeçalho
            token = req.headers.authorization.split(' ')[1];

            // 2. Verificar o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Encontrar o usuário pelo ID do token e anexá-lo ao objeto 'req'
            // O '-password' é um exemplo, caso você adicione senhas no futuro.
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                 return res.status(401).json({ error: 'Não autorizado, usuário não encontrado.' });
            }

            next(); // Prossegue para a próxima função (o controller da rota)
        } catch (error) {
            console.error(error);
            return res.status(401).json({ error: 'Não autorizado, token inválido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Não autorizado, nenhum token fornecido.' });
    }
};

module.exports = { protect };
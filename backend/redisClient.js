// backend/redisClient.js

const { createClient } = require('redis');

// Cria o cliente Redis. Por defeito, ele tentará ligar-se a redis://localhost:6379
const redisClient = createClient({
    // Se o seu Redis estiver a ser executado noutro local, configure o URL aqui.
    // url: 'redis://user:password@host:port'
});

redisClient.on('error', (err) => {
    console.error('Erro no Cliente Redis:', err);
});

redisClient.on('connect', () => {
    console.log('Cliente Redis ligado com sucesso.');
});

redisClient.on('reconnecting', () => {
    console.log('A religar ao servidor Redis...');
});

// Envolve a função de ligação numa IIFE (Immediately Invoked Function Expression)
// para lidar com a natureza assíncrona da ligação.
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Não foi possível ligar ao Redis ao iniciar:', err);
    }
})();

module.exports = redisClient;
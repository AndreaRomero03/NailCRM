const { Pool } = require('pg');
require('dotenv').config();

// Configuramos la conexión usando la variable de tu archivo .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Verificamos si la conexión funciona al arrancar
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error adquiriendo el cliente de la base de datos:', err.stack);
    }
    console.log('¡Conexión exitosa a PostgreSQL en Supabase!');
    release();
});

module.exports = pool;
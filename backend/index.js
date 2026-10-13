const express = require('express');
const app = express();
const pool = require('./db'); // Importamos la conexión
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Middleware para que el servidor entienda formato JSON
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
    res.send('Servidor de NailCRM funcionando correctamente');
});

// Ruta para probar la base de datos
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            mensaje: 'Conexión a Supabase exitosa', 
            hora_servidor_bd: result.rows[0] 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error conectando a la base de datos' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
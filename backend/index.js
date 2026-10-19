require('dotenv').config();
const express = require('express');
const cors = require('cors');

const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes'); // 1. Importar la ruta

const app = express();
app.use(cors());
app.use(express.json());

// 2. Montar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
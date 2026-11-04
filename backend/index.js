require('dotenv').config();
const express = require('express');
const cors = require('cors');

const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const catalogoRoutes = require('./routes/catalogo');
const cotizacionesRoutes = require('./routes/cotizaciones');
const citasRoutes = require('./routes/citas');
const dashboardRouter = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

// 2. Montar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/dashboard', dashboardRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
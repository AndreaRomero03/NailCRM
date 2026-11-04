const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// RUTAS DE CATEGORÍAS (public.categorias)
// ==========================================

// GET: Obtener todas las categorías
router.get('/categorias', async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, descripcion, activo, created_at
      FROM public.categorias
      ORDER BY nombre ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error en GET /api/catalogo/categorias:', error);
    res.status(500).json({ error: `Error en base de datos (categorias): ${error.message}` });
  }
});

// POST: Crear una nueva categoría
router.post('/categorias', async (req, res) => {
  const { nombre, descripcion, activo } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
  }

  try {
    const query = `
      INSERT INTO public.categorias (nombre, descripcion, activo)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [
      nombre,
      descripcion || null,
      activo !== undefined ? Boolean(activo) : true
    ];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error en POST /api/catalogo/categorias:', error);
    res.status(500).json({ error: `Error al crear categoría: ${error.message}` });
  }
});

// PUT: Actualizar categoría existente
router.put('/categorias/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, activo } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
  }

  try {
    const query = `
      UPDATE public.categorias
      SET nombre = $1,
          descripcion = $2,
          activo = $3
      WHERE id = $4
      RETURNING *;
    `;
    const values = [
      nombre,
      descripcion || null,
      Boolean(activo),
      parseInt(id)
    ];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error en PUT /api/catalogo/categorias:', error);
    res.status(500).json({ error: `Error al actualizar categoría: ${error.message}` });
  }
});

// PATCH: Cambiar estado activo/inactivo de una categoría
router.patch('/categorias/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const query = `
      UPDATE public.categorias
      SET activo = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [Boolean(activo), parseInt(id)]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }

    res.json({ mensaje: 'Estado de categoría actualizado', categoria: rows[0] });
  } catch (error) {
    console.error('Error en PATCH /api/catalogo/categorias:', error);
    res.status(500).json({ error: `Error al cambiar estado de categoría: ${error.message}` });
  }
});

// ==========================================
// RUTAS DE ELEMENTOS (public.catalogo_elementos)
// ==========================================

const esDuracionValida = (duracion) =>
  (typeof duracion === 'number' || (typeof duracion === 'string' && duracion.trim() !== '')) &&
  Number.isInteger(Number(duracion)) &&
  Number(duracion) >= 1;

// GET: Obtener todos los elementos del catálogo
router.get('/elementos', async (req, res) => {
  try {
    const query = `
      SELECT e.id, e.categoria_id, e.concepto, e.duracion_minutos, e.precio, e.activo, e.created_at,
             COALESCE(c.nombre, 'Sin categoría') AS categoria_nombre
      FROM public.catalogo_elementos e
      LEFT JOIN public.categorias c ON e.categoria_id = c.id
      ORDER BY c.nombre ASC NULLS LAST, e.concepto ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error en GET /api/catalogo/elementos:', error);
    res.status(500).json({ error: `Error en base de datos (catalogo_elementos): ${error.message}` });
  }
});

// POST: Registrar un nuevo servicio/elemento
router.post('/elementos', async (req, res) => {
  const { categoria_id, concepto, duracion_minutos, precio, activo } = req.body;

  if (!concepto || precio === undefined) {
    return res.status(400).json({ error: 'El concepto y el precio son obligatorios.' });
  }

  if (!esDuracionValida(duracion_minutos)) {
    return res.status(400).json({ error: 'La duración debe ser un número entero mayor o igual a 1 minuto.' });
  }

  try {
    const query = `
      INSERT INTO public.catalogo_elementos (categoria_id, concepto, duracion_minutos, precio, activo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      categoria_id ? parseInt(categoria_id) : null,
      concepto,
      Number(duracion_minutos),
      parseFloat(precio),
      activo !== undefined ? Boolean(activo) : true
    ];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error en POST /api/catalogo/elementos:', error);
    res.status(500).json({ error: `Error al crear elemento: ${error.message}` });
  }
});

// PUT: Actualizar un servicio/elemento
router.put('/elementos/:id', async (req, res) => {
  const { id } = req.params;
  const { categoria_id, concepto, duracion_minutos, precio, activo } = req.body;

  if (!concepto || precio === undefined) {
    return res.status(400).json({ error: 'El concepto y el precio son obligatorios.' });
  }

  if (!esDuracionValida(duracion_minutos)) {
    return res.status(400).json({ error: 'La duración debe ser un número entero mayor o igual a 1 minuto.' });
  }

  try {
    const query = `
      UPDATE public.catalogo_elementos
      SET categoria_id = $1,
          concepto = $2,
          duracion_minutos = $3,
          precio = $4,
          activo = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [
      categoria_id ? parseInt(categoria_id) : null,
      concepto,
      Number(duracion_minutos),
      parseFloat(precio),
      Boolean(activo),
      id
    ];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error en PUT /api/catalogo/elementos:', error);
    res.status(500).json({ error: `Error al actualizar elemento: ${error.message}` });
  }
});

// PATCH: Cambiar estado activo / inactivo de elemento
router.patch('/elementos/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const query = `
      UPDATE public.catalogo_elementos
      SET activo = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [Boolean(activo), id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado.' });
    }

    res.json({ mensaje: 'Estado actualizado correctamente', elemento: rows[0] });
  } catch (error) {
    console.error('Error en PATCH /api/catalogo/elementos:', error);
    res.status(500).json({ error: `Error al cambiar estado: ${error.message}` });
  }
});

module.exports = router;
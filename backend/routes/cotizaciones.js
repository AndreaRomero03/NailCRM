const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Función auxiliar: marca como 'vencida' cualquier cotización pendiente cuya fecha_vencimiento ya pasó
const actualizarCotizacionesVencidas = async () => {
  await pool.query(`
    UPDATE public.cotizaciones
    SET estado = 'vencida'
    WHERE estado = 'pendiente'
      AND fecha_vencimiento < CURRENT_DATE;
  `);
};

// GET: Obtener parámetros globales de costo por hora y margen de ganancia
router.get('/parametros', async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO public.configuracion_cotizacion (id, costo_hora, margen_ganancia)
      VALUES (1, 0.00, 0.00)
      ON CONFLICT (id) DO NOTHING;
    `);
    const { rows } = await pool.query(
      'SELECT costo_hora, margen_ganancia, updated_at FROM public.configuracion_cotizacion WHERE id = 1;'
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Error en GET /api/cotizaciones/parametros:', error);
    res.status(500).json({ error: `Error al obtener parámetros: ${error.message}` });
  }
});

// PUT: Actualizar parámetros globales de costo por hora y margen de ganancia
router.put('/parametros', async (req, res) => {
  const { costo_hora, margen_ganancia } = req.body;
  const costoHoraNum = parseFloat(costo_hora);
  const margenNum = parseFloat(margen_ganancia);

  if (isNaN(costoHoraNum) || costoHoraNum < 0) {
    return res.status(400).json({ error: 'El costo por hora debe ser un número mayor o igual a 0.' });
  }
  if (isNaN(margenNum) || margenNum < 0) {
    return res.status(400).json({ error: 'El margen de ganancia debe ser un porcentaje mayor o igual a 0.' });
  }

  try {
    const query = `
      INSERT INTO public.configuracion_cotizacion (id, costo_hora, margen_ganancia, updated_at)
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
      SET costo_hora = EXCLUDED.costo_hora,
          margen_ganancia = EXCLUDED.margen_ganancia,
          updated_at = NOW()
      RETURNING costo_hora, margen_ganancia, updated_at;
    `;
    const { rows } = await pool.query(query, [costoHoraNum, margenNum]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error en PUT /api/cotizaciones/parametros:', error);
    res.status(500).json({ error: `Error al guardar parámetros: ${error.message}` });
  }
});

// GET: Obtener todas las cotizaciones con datos del cliente
router.get('/', async (req, res) => {
  try {
    await actualizarCotizacionesVencidas();

    const query = `
      SELECT c.folio, c.cliente_id, c.duracion_estimada_minutos, c.total, 
             c.fecha_emision, c.fecha_vencimiento, c.estado, c.created_at,
             cl.nombre AS cliente_nombre, cl.apellido_paterno AS cliente_apellido, 
             cl.apellido_materno AS cliente_apellido_materno, cl.telefono AS cliente_telefono
      FROM public.cotizaciones c
      LEFT JOIN public.clientes cl ON c.cliente_id = cl.id
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error en GET /api/cotizaciones:', error);
    res.status(500).json({ error: `Error en base de datos: ${error.message}` });
  }
});

// GET: Obtener detalle completo de una cotización por folio
router.get('/:folio', async (req, res) => {
  const { folio } = req.params;
  try {
    await actualizarCotizacionesVencidas();

    const queryCotizacion = `
      SELECT c.folio, c.cliente_id, c.duracion_estimada_minutos, c.total, 
             c.fecha_emision, c.fecha_vencimiento, c.estado, c.created_at,
             cl.nombre, cl.apellido_paterno, cl.apellido_materno, cl.telefono, cl.tipo
      FROM public.cotizaciones c
      LEFT JOIN public.clientes cl ON c.cliente_id = cl.id
      WHERE c.folio = $1;
    `;
    const resCot = await pool.query(queryCotizacion, [folio]);

    if (resCot.rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada.' });
    }

    const queryDetalles = `
      SELECT d.id, d.folio_cotizacion, d.elemento_id, d.concepto, d.cantidad, d.precio_unitario, d.subtotal, d.created_at,
             e.categoria_id, e.tipo_cobro, cat.nombre AS categoria_nombre
      FROM public.cotizacion_detalles d
      LEFT JOIN public.catalogo_elementos e ON d.elemento_id = e.id
      LEFT JOIN public.categorias cat ON e.categoria_id = cat.id
      WHERE d.folio_cotizacion = $1;
    `;
    const resDet = await pool.query(queryDetalles, [folio]);

    res.json({
      cotizacion: resCot.rows[0],
      detalles: resDet.rows
    });
  } catch (error) {
    console.error('Error al obtener detalle de cotización:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Crear cotización
router.post('/', async (req, res) => {
  const { cliente_id, duracion_estimada_minutos, total, fecha_vencimiento, detalles } = req.body;

  if (!cliente_id) return res.status(400).json({ error: 'Debes seleccionar una clienta.' });
  if (!fecha_vencimiento) return res.status(400).json({ error: 'La fecha de vencimiento es obligatoria.' });
  if (!detalles || detalles.length === 0) return res.status(400).json({ error: 'Agrega al menos un servicio al desglose.' });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const countRes = await client.query('SELECT COUNT(*) FROM public.cotizaciones;');
    const correlativo = String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0');
    const fechaHoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const folio = `COT-${fechaHoyStr}-${correlativo}`;

    const insertCotQuery = `
      INSERT INTO public.cotizaciones (folio, cliente_id, duracion_estimada_minutos, total, fecha_emision, fecha_vencimiento, estado)
      VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'pendiente')
      RETURNING *;
    `;
    const cotRes = await client.query(insertCotQuery, [
      folio,
      cliente_id,
      parseInt(duracion_estimada_minutos) || 0,
      parseFloat(total),
      fecha_vencimiento
    ]);

    for (const item of detalles) {
      const insertDetQuery = `
        INSERT INTO public.cotizacion_detalles (folio_cotizacion, elemento_id, concepto, cantidad, precio_unitario, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6);
      `;

      await client.query(insertDetQuery, [
        folio,
        item.elemento_id || null,
        item.concepto,
        parseInt(item.cantidad) || 1,
        parseFloat(item.precio_unitario),
        parseFloat(item.subtotal)
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Cotización registrada con éxito', cotizacion: cotRes.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/cotizaciones:', error);
    res.status(500).json({ error: `Error al guardar cotización: ${error.message}` });
  } finally {
    client.release();
  }
});

// PATCH: Cambiar estado
router.patch('/:folio/estado', async (req, res) => {
  const { folio } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['pendiente', 'aceptada', 'rechazada', 'vencida'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  try {
    const query = `
      UPDATE public.cotizaciones
      SET estado = $1
      WHERE folio = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [estado, folio]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al cambiar estado de cotización:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
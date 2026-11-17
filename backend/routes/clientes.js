const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET: Sincronizar vigencia de 60 días y obtener clientas ordenadas por recurrencia y cantidad de citas
router.get('/', async (req, res) => {
  try {
    // 1. Actualizar automáticamente a 'esporadica' a quienes tengan citas completadas pero > 60 días sin venir
    await pool.query(`
      WITH resumen_citas AS (
        SELECT 
          cliente_id,
          COUNT(*) AS total_completadas,
          MAX(fecha_hora_inicio) AS ultima_cita
        FROM public.citas
        WHERE estado::text ILIKE '%completada%'
        GROUP BY cliente_id
      )
      UPDATE public.clientes c
      SET tipo = CASE
        WHEN rc.total_completadas IS NULL OR rc.total_completadas = 0 THEN 'nueva'::tipo_cliente
        WHEN EXTRACT(EPOCH FROM (NOW() - rc.ultima_cita)) / 86400 > 60 THEN 'esporadica'::tipo_cliente
        WHEN rc.total_completadas >= 2 AND EXTRACT(EPOCH FROM (NOW() - rc.ultima_cita)) / 86400 <= 60 THEN 'recurrente'::tipo_cliente
        ELSE 'nueva'::tipo_cliente
      END
      FROM resumen_citas rc
      WHERE c.id = rc.cliente_id
        AND c.tipo IS DISTINCT FROM (
          CASE
            WHEN rc.total_completadas IS NULL OR rc.total_completadas = 0 THEN 'nueva'::tipo_cliente
            WHEN EXTRACT(EPOCH FROM (NOW() - rc.ultima_cita)) / 86400 > 60 THEN 'esporadica'::tipo_cliente
            WHEN rc.total_completadas >= 2 AND EXTRACT(EPOCH FROM (NOW() - rc.ultima_cita)) / 86400 <= 60 THEN 'recurrente'::tipo_cliente
            ELSE 'nueva'::tipo_cliente
          END
        );
    `);

    // 2. Consultar todas las clientas con su conteo de citas completadas, priorizando recurrentes y mayor cantidad de citas
    const query = `
      SELECT 
        c.*,
        COALESCE(COUNT(ci.folio_cotizacion) FILTER (WHERE ci.estado::text ILIKE '%completada%'), 0)::int AS total_citas
      FROM public.clientes c
      LEFT JOIN public.citas ci ON c.id = ci.cliente_id
      GROUP BY c.id
      ORDER BY 
        CASE c.tipo::text
          WHEN 'recurrente' THEN 1
          WHEN 'nueva' THEN 2
          WHEN 'esporadica' THEN 3
          ELSE 4
        END ASC,
        total_citas DESC,
        c.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener el expediente e historial completo de una clienta por su ID
router.get('/:id/historial', async (req, res) => {
  const { id } = req.params;

  try {
    const clienteQuery = `SELECT * FROM public.clientes WHERE id = $1;`;
    const clienteRes = await pool.query(clienteQuery, [id]);

    if (clienteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Clienta no encontrada.' });
    }

    const cotizacionesQuery = `
      SELECT folio, duracion_estimada_minutos, total, fecha_emision, fecha_vencimiento, estado, created_at
      FROM public.cotizaciones
      WHERE cliente_id = $1
      ORDER BY created_at DESC;
    `;
    const cotizacionesRes = await pool.query(cotizacionesQuery, [id]);

    const citasQuery = `
      SELECT ci.folio_cotizacion, ci.fecha_hora_inicio, ci.fecha_hora_fin, ci.total, ci.estado, ci.created_at,
             u.nombre AS manicurista_nombre, u.apellido_paterno AS manicurista_apellido
      FROM public.citas ci
      LEFT JOIN public.usuarios u ON ci.manicurista_id = u.id
      WHERE ci.cliente_id = $1
      ORDER BY ci.fecha_hora_inicio DESC;
    `;
    const citasRes = await pool.query(citasQuery, [id]);

    res.json({
      cliente: clienteRes.rows[0],
      cotizaciones: cotizacionesRes.rows,
      citas: citasRes.rows
    });
  } catch (error) {
    console.error('Error al obtener historial de la clienta:', error);
    res.status(500).json({ error: `Error de base de datos: ${error.message}` });
  }
});

// POST: Registrar nueva clienta (siempre inicia como 'nueva' por default)
router.post('/', async (req, res) => {
  const {
    nombre, apellido_paterno, apellido_materno, telefono,
    fecha_nacimiento, alergia, nombre_contacto_emergencia,
    telefono_contacto_emergencia, preferencias, observaciones
  } = req.body;

  try {
    const query = `
      INSERT INTO public.clientes (
        nombre, apellido_paterno, apellido_materno, telefono,
        fecha_nacimiento, alergia, nombre_contacto_emergencia,
        telefono_contacto_emergencia, preferencias, tipo, observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'nueva', $10)
      RETURNING *;
    `;
    const values = [
      nombre, apellido_paterno || null, apellido_materno || null, telefono,
      fecha_nacimiento || null, Boolean(alergia), nombre_contacto_emergencia || null,
      telefono_contacto_emergencia || null, preferencias || null, observaciones || null
    ];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT: Actualizar datos de la clienta (el campo 'tipo' se mantiene gestionado por el sistema)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre, apellido_paterno, apellido_materno, telefono,
    fecha_nacimiento, alergia, nombre_contacto_emergencia,
    telefono_contacto_emergencia, preferencias, observaciones
  } = req.body;

  try {
    const query = `
      UPDATE public.clientes
      SET nombre = $1, apellido_paterno = $2, apellido_materno = $3, telefono = $4,
          fecha_nacimiento = $5, alergia = $6, nombre_contacto_emergencia = $7,
          telefono_contacto_emergencia = $8, preferencias = $9, observaciones = $10
      WHERE id = $11
      RETURNING *;
    `;
    const values = [
      nombre, apellido_paterno || null, apellido_materno || null, telefono,
      fecha_nacimiento || null, Boolean(alergia), nombre_contacto_emergencia || null,
      telefono_contacto_emergencia || null, preferencias || null, observaciones || null, id
    ];
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Clienta no encontrada.' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
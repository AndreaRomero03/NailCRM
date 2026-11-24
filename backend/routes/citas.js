const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET: Obtener cotizaciones aceptadas que AÚN NO han sido agendadas
router.get('/cotizaciones-aceptadas', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.folio, 
        c.cliente_id, 
        c.duracion_estimada_minutos, 
        c.total, 
        c.created_at,
        COALESCE(cl.nombre, 'Clienta') AS cliente_nombre, 
        COALESCE(cl.apellido_paterno, '') AS cliente_apellido, 
        COALESCE(cl.telefono, '') AS cliente_telefono
      FROM public.cotizaciones c
      LEFT JOIN public.clientes cl 
        ON c.cliente_id = cl.id
      LEFT JOIN public.citas ci 
        ON c.folio::text = ci.folio_cotizacion::text
      WHERE LOWER(TRIM(c.estado::text)) = 'aceptada'
        AND ci.folio_cotizacion IS NULL
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al consultar cotizaciones aceptadas:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener manicuristas activos
router.get('/manicuristas', async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, apellido_paterno, apellido_materno, rol 
      FROM public.usuarios 
      WHERE activo = true AND LOWER(TRIM(rol::text)) = 'manicurista'
      ORDER BY nombre ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al consultar manicuristas:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Obtener todas las citas
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT ci.folio_cotizacion, ci.cliente_id, ci.manicurista_id, 
             ci.fecha_hora_inicio, ci.fecha_hora_fin, ci.total, ci.estado, ci.created_at,
             cl.nombre AS cliente_nombre, cl.apellido_paterno AS cliente_apellido, cl.telefono AS cliente_telefono,
             u.nombre AS manicurista_nombre, u.apellido_paterno AS manicurista_apellido
      FROM public.citas ci
      LEFT JOIN public.clientes cl ON ci.cliente_id = cl.id
      LEFT JOIN public.usuarios u ON ci.manicurista_id = u.id
      ORDER BY ci.fecha_hora_inicio ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Registrar nueva cita con validaciones de choque y holgura de 15 min
router.post('/', async (req, res) => {
  const { folio_cotizacion, manicurista_id, fecha_hora_inicio } = req.body;

  if (!folio_cotizacion) return res.status(400).json({ error: 'La cita debe estar ligada a una cotización aceptada.' });
  if (!manicurista_id) return res.status(400).json({ error: 'Debes seleccionar la manicurista encargada.' });
  if (!fecha_hora_inicio) return res.status(400).json({ error: 'La fecha y hora de inicio son obligatorias.' });

  try {
    // Validar rango permitido: a partir de mañana y máximo 30 días después de la fecha actual
    const inicio = new Date(fecha_hora_inicio);
    if (isNaN(inicio.getTime())) {
      return res.status(400).json({ error: 'La fecha y hora de inicio no son válidas.' });
    }

    const ahora = new Date();
    const inicioManana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0, 0);
    const finMax30Dias = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 30, 23, 59, 59, 999);

    if (inicio < inicioManana) {
      return res.status(400).json({ error: 'No se pueden agendar citas para el día actual ni fechas pasadas. Selecciona una fecha a partir de mañana.' });
    }
    if (inicio > finMax30Dias) {
      return res.status(400).json({ error: 'Solo se pueden agendar citas con un máximo de 30 días posteriores a la fecha actual.' });
    }

    // 1. Obtener la cotización
    const cotQuery = `SELECT folio, cliente_id, duracion_estimada_minutos, total, estado FROM public.cotizaciones WHERE folio = $1;`;
    const cotRes = await pool.query(cotQuery, [folio_cotizacion]);

    if (cotRes.rows.length === 0) return res.status(404).json({ error: 'La cotización especificada no existe.' });

    const cotizacion = cotRes.rows[0];
    if (String(cotizacion.estado).trim().toLowerCase() !== 'aceptada') {
      return res.status(400).json({ error: 'Solo se pueden agendar citas para cotizaciones aceptadas.' });
    }

    // 2. Calcular inicio y fin exacto en base a la duración de la cotización
    const duracionMinutos = parseInt(cotizacion.duracion_estimada_minutos) || 60;
    const fin = new Date(inicio.getTime() + duracionMinutos * 60000);

    // 3. Validar traslape/empalme de horarios para la misma manicurista
    // Se contemplan 15 minutos de holgura entre citas (fecha_hora_fin + 15 minutos)
    const empalmeQuery = `
      SELECT folio_cotizacion 
      FROM public.citas 
      WHERE manicurista_id = $1
        AND LOWER(TRIM(estado::text)) = 'programada'
        AND $2::timestamp < (fecha_hora_fin + INTERVAL '15 minutes')
        AND $3::timestamp > fecha_hora_inicio;
    `;
    
    const empalmeRes = await pool.query(empalmeQuery, [
      manicurista_id,
      inicio.toISOString(),
      fin.toISOString()
    ]);

    if (empalmeRes.rows.length > 0) {
      return res.status(400).json({ 
        error: 'La manicurista ya tiene una cita programada en ese horario o dentro del margen de 15 minutos de holgura.' 
      });
    }

    // 4. Inserción de la cita con estado inicial en minúsculas 'programada'
    const insertQuery = `
      INSERT INTO public.citas (folio_cotizacion, cliente_id, manicurista_id, fecha_hora_inicio, fecha_hora_fin, total, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'programada')
      RETURNING *;
    `;

    const values = [
      folio_cotizacion,
      cotizacion.cliente_id,
      manicurista_id,
      inicio.toISOString(),
      fin.toISOString(),
      parseFloat(cotizacion.total)
    ];

    const { rows } = await pool.query(insertQuery, values);
    res.status(201).json({ mensaje: 'Cita agendada exitosamente', cita: rows[0] });

  } catch (error) {
    console.error('Error al registrar cita:', error);
    res.status(500).json({ error: `Error al agendar cita: ${error.message}` });
  }
});

// PATCH: Cambiar estado de la cita (programada, completada, cancelada)
router.patch('/:folio_cotizacion/estado', async (req, res) => {
  const { folio_cotizacion } = req.params;
  const { estado } = req.body;

  if (!estado) return res.status(400).json({ error: 'El estado es requerido.' });

  // Limpiar y normalizar el estado recibido
  const estadoNormalizado = String(estado).trim().toLowerCase();

  try {
    // Intentamos la actualización haciendo cast dinámico al tipo de columna existente
    const query = `
      UPDATE public.citas
      SET estado = $1::text::public.estado_cita
      WHERE folio_cotizacion = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [estadoNormalizado, folio_cotizacion]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    res.json(rows[0]);
  } catch (error) {
    // Si falla por el tipo de datos ENUM explícito, realizamos el UPDATE estándar en texto
    try {
      const fallbackQuery = `
        UPDATE public.citas
        SET estado = $1
        WHERE folio_cotizacion = $2
        RETURNING *;
      `;
      const { rows } = await pool.query(fallbackQuery, [estadoNormalizado, folio_cotizacion]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Cita no encontrada.' });
      }

      return res.json(rows[0]);
    } catch (fallbackError) {
      console.error('Error al actualizar estado de la cita:', fallbackError);
      return res.status(500).json({ 
        error: `Error de base de datos (${fallbackError.message}). Verifica los valores permitidos del ENUM estado_cita.` 
      });
    }
  }
});

module.exports = router;
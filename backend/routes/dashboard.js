const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET: Métricas reales corregidas para el Dashboard
router.get('/', async (req, res) => {
  try {
    // 1. Cotizaciones Generadas Totales
    const resGeneradas = await pool.query('SELECT COUNT(*)::int AS total FROM public.cotizaciones;');
    
    // 2. Cotizaciones por Estado (usando ILIKE para evitar fallos por minúsculas/espacios)
    const resAceptadas = await pool.query(`
      SELECT COUNT(*)::int AS total 
      FROM public.cotizaciones 
      WHERE estado::text ILIKE '%aceptada%';
    `);

    const resPendientes = await pool.query(`
      SELECT COUNT(*)::int AS total 
      FROM public.cotizaciones 
      WHERE estado::text ILIKE '%pendiente%';
    `);

    const resRechazadas = await pool.query(`
      SELECT COUNT(*)::int AS total 
      FROM public.cotizaciones 
      WHERE estado::text ILIKE '%rechazada%';
    `);

    // 3. Citas Atendidas (Completadas)
    const resCitasCompletadas = await pool.query(`
      SELECT COUNT(*)::int AS total 
      FROM public.citas 
      WHERE estado::text ILIKE '%completada%' OR estado::text ILIKE '%completado%';
    `);

    // 4. Citas Programadas Hoy (compara la fecha sin importar hora)
    const resCitasHoy = await pool.query(`
      SELECT COUNT(*)::int AS total 
      FROM public.citas 
      WHERE fecha_hora_inicio::date = CURRENT_DATE 
        AND estado::text ILIKE '%programada%';
    `);

    // 5. Proporción Clientas Nuevas vs. Recurrentes
    const resNuevas = await pool.query(`SELECT COUNT(*)::int AS total FROM public.clientes WHERE tipo::text ILIKE '%nueva%';`);
    const resRecurrentes = await pool.query(`SELECT COUNT(*)::int AS total FROM public.clientes WHERE tipo::text ILIKE '%recurrente%';`);

    // 6. Top Servicios Más Solicitados
    const resTopServicios = await pool.query(`
      SELECT concepto, COUNT(*)::int AS cantidad
      FROM public.cotizacion_detalles
      GROUP BY concepto
      ORDER BY cantidad DESC
      LIMIT 5;
    `);

    // 7. Cotizaciones Recientes (con JOIN a clientes)
    const resUltimasCot = await pool.query(`
      SELECT c.folio, c.total, c.fecha_vencimiento, c.estado, c.created_at,
             COALESCE(cl.nombre, 'Clienta') AS cliente_nombre, 
             COALESCE(cl.apellido_paterno, '') AS cliente_apellido,
             (
               SELECT cd.concepto 
               FROM public.cotizacion_detalles cd 
               WHERE cd.folio_cotizacion = c.folio 
               LIMIT 1
             ) AS servicio_principal
      FROM public.cotizaciones c
      LEFT JOIN public.clientes cl ON c.cliente_id = cl.id
      ORDER BY c.created_at DESC
      LIMIT 10;
    `);

    // Extracción limpia de números
    const generadas = Number(resGeneradas.rows[0]?.total) || 0;
    const aceptadas = Number(resAceptadas.rows[0]?.total) || 0;
    const pendientes = Number(resPendientes.rows[0]?.total) || 0;
    const rechazadas = Number(resRechazadas.rows[0]?.total) || 0;
    const citasAtendidas = Number(resCitasCompletadas.rows[0]?.total) || 0;
    const citasHoy = Number(resCitasHoy.rows[0]?.total) || 0;

    // Cálculo de la tasa de conversión real
    const tasaConversion = generadas > 0 
      ? Number(((aceptadas / generadas) * 100).toFixed(1)) 
      : 0;

    // Métricas de clientes
    const nuevas = Number(resNuevas.rows[0]?.total) || 0;
    const recurrentes = Number(resRecurrentes.rows[0]?.total) || 0;
    const totalClientesSum = nuevas + recurrentes;

    const pctNuevas = totalClientesSum > 0 ? Math.round((nuevas / totalClientesSum) * 100) : 0;
    const pctRecurrentes = totalClientesSum > 0 ? Math.round((recurrentes / totalClientesSum) * 100) : 0;

    res.json({
      kpis: {
        generadas,
        aceptadas,
        pendientes,
        rechazadas,
        tasaConversion,
        citasAtendidas,
        citasHoy
      },
      clientesMetricas: {
        nuevas,
        pctNuevas,
        recurrentes,
        pctRecurrentes
      },
      topServicios: resTopServicios.rows || [],
      cotizacionesRecientes: resUltimasCot.rows || []
    });

  } catch (error) {
    console.error('Error al calcular métricas en GET /api/dashboard:', error);
    res.status(500).json({ error: `Error de cálculo en base de datos: ${error.message}` });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET: Consultar todas las clientas con el esquema oficial exacto
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, apellido_paterno, apellido_materno, telefono,
             fecha_nacimiento, alergia, nombre_contacto_emergencia,
             telefono_contacto_emergencia, preferencias, tipo, observaciones, created_at
      FROM public.clientes
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al consultar clientes:', error);
    res.status(500).json({ error: error.message || 'Error al obtener la lista de clientes.' });
  }
});

// POST: Registrar nueva clienta
router.post('/', async (req, res) => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    telefono,
    fecha_nacimiento,
    alergia,
    nombre_contacto_emergencia,
    telefono_contacto_emergencia,
    preferencias,
    tipo,
    observaciones
  } = req.body;

  if (!nombre || !telefono) {
    return res.status(400).json({ error: 'El nombre y el teléfono son obligatorios.' });
  }

  try {
    const query = `
      INSERT INTO public.clientes (
        nombre, apellido_paterno, apellido_materno, telefono,
        fecha_nacimiento, alergia, nombre_contacto_emergencia,
        telefono_contacto_emergencia, preferencias, tipo, observaciones
      )
      VALUES (
        $1, $2, $3, $4,
        NULLIF($5, '')::date,
        $6, $7, $8, $9, $10, $11
      )
      RETURNING *;
    `;
    const values = [
      nombre,
      apellido_paterno || null,
      apellido_materno || null,
      telefono,
      fecha_nacimiento || null,
      Boolean(alergia),
      nombre_contacto_emergencia || null,
      telefono_contacto_emergencia || null,
      preferencias || null,
      tipo || 'nueva',
      observaciones || null
    ];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al registrar cliente:', error);
    res.status(500).json({ error: error.message || 'Error al guardar en la base de datos.' });
  }
});

// PUT: Actualizar clienta existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    telefono,
    fecha_nacimiento,
    alergia,
    nombre_contacto_emergencia,
    telefono_contacto_emergencia,
    preferencias,
    tipo,
    observaciones
  } = req.body;

  try {
    const query = `
      UPDATE public.clientes
      SET nombre = $1,
          apellido_paterno = $2,
          apellido_materno = $3,
          telefono = $4,
          fecha_nacimiento = NULLIF($5, '')::date,
          alergia = $6,
          nombre_contacto_emergencia = $7,
          telefono_contacto_emergencia = $8,
          preferencias = $9,
          tipo = $10,
          observaciones = $11
      WHERE id = $12
      RETURNING *;
    `;
    const values = [
      nombre,
      apellido_paterno || null,
      apellido_materno || null,
      telefono,
      fecha_nacimiento || null,
      Boolean(alergia),
      nombre_contacto_emergencia || null,
      telefono_contacto_emergencia || null,
      preferencias || null,
      tipo || 'nueva',
      observaciones || null,
      id
    ];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Clienta no encontrada.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: error.message || 'Error al modificar la información de la clienta.' });
  }
});

module.exports = router;
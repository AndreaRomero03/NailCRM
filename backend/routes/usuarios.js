const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET: Obtener la lista completa de usuarios unificada con auth.users
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.nombre, u.apellido_paterno, u.apellido_materno, u.rol, u.activo, u.created_at,
             au.email
      FROM public.usuarios u
      LEFT JOIN auth.users au ON u.id = au.id
      ORDER BY u.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: error.message || 'Error al consultar la lista de usuarios.' });
  }
});

// POST: Registrar nuevo usuario en Supabase Auth y sincronizar en public.usuarios
router.post('/', async (req, res) => {
  const { email, password, nombre, apellido_paterno, apellido_materno, rol } = req.body;

  if (!email || !password || !nombre || !rol) {
    return res.status(400).json({ error: 'Correo, contraseña, nombre y rol son obligatorios.' });
  }

  try {
    // 1. Crear usuario en Supabase Auth con metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellido_paterno: apellido_paterno || '',
          apellido_materno: apellido_materno || '',
          rol: rol.toLowerCase()
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // 2. Asegurar/Actualizar registro en public.usuarios por si el trigger usó valores por defecto
    const queryUpsert = `
      INSERT INTO public.usuarios (id, nombre, apellido_paterno, apellido_materno, rol, activo)
      VALUES ($1, $2, $3, $4, $5::public.rol_usuario, TRUE)
      ON CONFLICT (id) DO UPDATE
      SET nombre = EXCLUDED.nombre,
          apellido_paterno = EXCLUDED.apellido_paterno,
          apellido_materno = EXCLUDED.apellido_materno,
          rol = EXCLUDED.rol
      RETURNING *;
    `;
    const values = [
      userId,
      nombre,
      apellido_paterno || null,
      apellido_materno || null,
      rol.toLowerCase()
    ];

    const { rows } = await pool.query(queryUpsert, values);

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: { ...rows[0], email }
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: error.message || 'Error interno al registrar el usuario.' });
  }
});

// PUT: Actualizar datos personales y rol del usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido_paterno, apellido_materno, rol, activo } = req.body;

  if (!nombre || !rol) {
    return res.status(400).json({ error: 'El nombre y el rol son obligatorios.' });
  }

  try {
    const query = `
      UPDATE public.usuarios
      SET nombre = $1,
          apellido_paterno = $2,
          apellido_materno = $3,
          rol = $4::public.rol_usuario,
          activo = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [
      nombre,
      apellido_paterno || null,
      apellido_materno || null,
      rol.toLowerCase(),
      Boolean(activo),
      id
    ];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar la información del usuario.' });
  }
});

// PATCH: Cambiar estado activo/inactivo de un usuario
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const query = `
      UPDATE public.usuarios
      SET activo = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [Boolean(activo), id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({ mensaje: 'Estado actualizado correctamente', usuario: rows[0] });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: error.message || 'Error al cambiar el estado del usuario.' });
  }
});

module.exports = router;
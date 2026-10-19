const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// POST: Iniciar sesión con Supabase Auth
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debes proporcionar correo y contraseña.' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo o contraseña.' });
    }

    const userId = authData.user.id;

    const query = `
      SELECT id, nombre, apellido_paterno, apellido_materno, rol, activo
      FROM public.usuarios
      WHERE id = $1;
    `;
    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'El usuario no tiene un perfil asignado en el sistema.' });
    }

    const perfil = rows[0];

    if (!perfil.activo) {
      return res.status(403).json({ error: 'Tu cuenta se encuentra desactivada. Contacta a la administración.' });
    }

    res.json({
      token: authData.session.access_token,
      usuario: {
        id: perfil.id,
        nombre: perfil.nombre,
        apellido_paterno: perfil.apellido_paterno,
        apellido_materno: perfil.apellido_materno,
        email: authData.user.email,
        rol: perfil.rol,
      }
    });

  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    res.status(500).json({ error: 'Error interno del servidor durante la autenticación.' });
  }
});

// POST: Solicitar restablecimiento de contraseña por correo
router.post('/recuperar-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Debes ingresar tu correo electrónico registrado.' });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.REDIRECT_URL || 'http://localhost:5173/restablecer-password',
    });

    if (error) {
      // Capturar y traducir el límite de intentos de Supabase
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Has superado el límite de solicitudes de correo de Supabase. Por favor espera unos minutos antes de intentar nuevamente.'
        });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ mensaje: 'Se ha enviado un enlace de recuperación a tu correo electrónico.' });
  } catch (error) {
    console.error('Error en /api/auth/recuperar-password:', error);
    res.status(500).json({ error: 'Error interno al procesar la solicitud de recuperación.' });
  }
});

module.exports = router;
import React, { useState } from 'react';

const Login = ({ onLoginExitoso }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Estado para alternar entre Login y Recuperación
  const [modoRecuperacion, setModoRecuperacion] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');

  // Manejar el inicio de sesión
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);
    setCargando(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(`Error del servidor (${res.status}: ${res.statusText}). Verifica que el servidor Node.js esté encendido.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al iniciar sesión.');
      }

      // Guardar sesión de forma segura en localStorage (sin contraseñas)
      localStorage.setItem('nailcrm_token', data.token);
      localStorage.setItem('nailcrm_usuario', JSON.stringify({
        id: data.usuario.id,
        nombre: data.usuario.nombre,
        apellido_paterno: data.usuario.apellido_paterno,
        apellido_materno: data.usuario.apellido_materno,
        email: data.usuario.email,
        rol: data.usuario.rol,
      }));

      if (onLoginExitoso) {
        onLoginExitoso(data.usuario);
      }
    } catch (err) {
      setMensajeError(err.message);
    } finally {
      // Limpieza inmediata de la contraseña del estado en memoria
      setPassword('');
      setCargando(false);
    }
  };

  // Manejar solicitud de restablecimiento de contraseña
  const handleRecuperarSubmit = async (e) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);
    setCargando(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/recuperar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRecuperacion }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(`El servidor respondió con un error (${res.status}: ${res.statusText}). Asegúrate de haber reiniciado el servidor Node.js.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo enviar el correo de recuperación.');
      }

      setMensajeExito(data.mensaje || 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.');
    } catch (err) {
      setMensajeError(err.message);
    } finally {
      setEmailRecuperacion('');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8">
        
        {/* LOGO E IDENTIDAD */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#B82B71] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Atenea Studio</h1>
          <p className="text-xs text-gray-500 mt-1">Sistema de Gestión CRM & Control de Citas</p>
        </div>

        {/* MENSAJES DE ALERTA */}
        {mensajeError && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{mensajeError}</span>
          </div>
        )}

        {mensajeExito && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <span>✅</span>
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* MODO 1: FORMULARIO DE INICIO DE SESIÓN */}
        {!modoRecuperacion ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-sm" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71] transition-colors"
                placeholder="usuario@ateneastudio.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMensajeError(null);
                    setMensajeExito(null);
                    setEmailRecuperacion(email);
                    setPassword('');
                    setModoRecuperacion(true);
                  }}
                  className="text-xs text-[#B82B71] hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full mt-2 bg-[#B82B71] hover:bg-[#9d2460] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {cargando ? 'Iniciando sesión...' : 'Ingresar al sistema'}
            </button>
          </form>
        ) : (
          /* MODO 2: FORMULARIO DE RESTABLECIMIENTO DE CONTRASEÑA */
          <form onSubmit={handleRecuperarSubmit} className="space-y-4 text-sm" autoComplete="off">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Recuperar contraseña</h2>
              <p className="text-xs text-gray-500 mb-4">
                Ingresa tu correo electrónico registrado y te enviaremos una liga para restablecer tu contraseña.
              </p>

              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo electrónico registrado
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={emailRecuperacion}
                onChange={(e) => setEmailRecuperacion(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71] transition-colors"
                placeholder="usuario@ateneastudio.com"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#B82B71] hover:bg-[#9d2460] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {cargando ? 'Enviando solicitud...' : 'Enviar instrucciones'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMensajeError(null);
                setMensajeExito(null);
                setEmailRecuperacion('');
                setModoRecuperacion(false);
              }}
              className="w-full text-center text-xs text-gray-600 hover:text-gray-900 font-medium py-1"
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
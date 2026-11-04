import React, { useState, useEffect } from 'react';
import Login from './Login';
import Clientes from './Clientes';
import Usuarios from './Usuarios';
import Catalogo from './Catalogo';
import Cotizaciones from './Cotizaciones';
import Citas from './Citas';
import Dashboard from './Dashboard';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vistaActual, setVistaActual] = useState('clientes'); // Vista por defecto

  // Verificar si hay una sesión activa en localStorage al cargar la app
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('nailcrm_usuario');
    const token = localStorage.getItem('nailcrm_token');

    if (usuarioGuardado && token) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch (e) {
        localStorage.removeItem('nailcrm_usuario');
        localStorage.removeItem('nailcrm_token');
      }
    }
  }, []);

  const handleCerrarSesion = () => {
    localStorage.removeItem('nailcrm_usuario');
    localStorage.removeItem('nailcrm_token');
    setUsuario(null);
  };

  // Si no hay usuario autenticado, mostramos la pantalla de Login
  if (!usuario) {
    return <Login onLoginExitoso={(usr) => setUsuario(usr)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F8] flex font-sans text-gray-800">
      
      {/* NAVEGACIÓN LATERAL (SIDEBAR) */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          {/* LOGO E IDENTIDAD DEL ESTUDIO */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#B82B71] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
              A
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base leading-tight">Atenea Studio</h2>
              <p className="text-[11px] text-gray-400">CRM & Control de Citas</p>
            </div>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className="space-y-1.5 text-sm font-medium">
            <button
              onClick={() => setVistaActual('dashboard')}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                vistaActual === 'dashboard'
                  ? 'bg-[#B82B71] text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>📊</span> Dashboard
            </button>

            <button
              onClick={() => setVistaActual('clientes')}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                vistaActual === 'clientes'
                  ? 'bg-[#B82B71] text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>👥</span> Clientes
            </button>

            <button
              onClick={() => setVistaActual('cotizaciones')}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                vistaActual === 'cotizaciones'
                  ? 'bg-[#B82B71] text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>📄</span> Cotizaciones
            </button>
            
            <button
              onClick={() => setVistaActual('citas')}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                vistaActual === 'citas'
                  ? 'bg-[#B82B71] text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>📅</span> Citas
            </button>

            <button
              onClick={() => setVistaActual('catalogo')}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                vistaActual === 'catalogo'
                  ? 'bg-[#B82B71] text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>💅</span> Catálogo de Servicios
            </button>

            <button
              onClick={() => setVistaActual('usuarios')}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                vistaActual === 'usuarios'
                  ? 'bg-[#B82B71] text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>🛡️</span> Personal / Usuarios
            </button>
          </nav>
        </div>

        {/* PIE DE PÁGINA CON PERFIL Y CERRA SESIÓN */}
        <div className="pt-4 border-t border-gray-100">
          <div className="mb-3 px-2">
            <p className="text-xs font-bold text-gray-900 truncate">
              {usuario.nombre} {usuario.apellido_paterno}
            </p>
            <p className="text-[11px] text-[#B82B71] capitalize font-medium">
              {usuario.rol}
            </p>
          </div>
          <button
            onClick={handleCerrarSesion}
            className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        {vistaActual === 'clientes' && <Clientes />}
        {vistaActual === 'cotizaciones' && <Cotizaciones />}
        {vistaActual === 'catalogo' && <Catalogo />}
        {vistaActual === 'usuarios' && <Usuarios />}
        {vistaActual === 'citas' && <Citas />}
        {vistaActual === 'dashboard' && <Dashboard />}
      </main>

    </div>
  );
}

export default App;
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
  const [vistaActual, setVistaActual] = useState('dashboard'); // Vista por defecto
  const [menuAbierto, setMenuAbierto] = useState(true); // Controla si el sidebar está visible o colapsado

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
    <div className="h-screen w-screen overflow-hidden bg-[#FAF9F8] flex font-sans text-gray-800">
      
      {/* NAVEGACIÓN LATERAL (SIDEBAR) FIJA */}
      <aside
        className={`h-full bg-white border-r border-gray-100 flex flex-col justify-between transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${
          menuAbierto ? 'w-64 p-6' : 'w-20 py-6 px-3 items-center'
        }`}
      >
        <div className="w-full">
          {/* LOGO E IDENTIDAD + BOTÓN COLAPSAR */}
          <div className={`flex items-center mb-8 ${menuAbierto ? 'justify-between' : 'flex-col gap-3'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-[#B82B71] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm flex-shrink-0">
                A
              </div>
              {menuAbierto && (
                <div className="whitespace-nowrap">
                  <h2 className="font-bold text-gray-900 text-base leading-tight">Atenea Studio</h2>
                  <p className="text-[11px] text-gray-400">CRM & Control de Citas</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              title={menuAbierto ? 'Ocultar menú' : 'Mostrar menú'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#B82B71] hover:bg-pink-50 transition-colors flex-shrink-0"
            >
              {menuAbierto ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className="space-y-1.5 text-sm font-medium w-full">
            {[
              { id: 'dashboard', icono: '📊', label: 'Dashboard' },
              { id: 'clientes', icono: '👥', label: 'Clientes' },
              { id: 'cotizaciones', icono: '📄', label: 'Cotizaciones' },
              { id: 'citas', icono: '📅', label: 'Citas' },
              { id: 'catalogo', icono: '💅', label: 'Catálogo de Servicios' },
              { id: 'usuarios', icono: '🛡️', label: 'Personal / Usuarios' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setVistaActual(item.id)}
                title={!menuAbierto ? item.label : ''}
                className={`w-full py-2.5 rounded-xl transition-colors flex items-center ${
                  menuAbierto ? 'px-4 gap-3 text-left' : 'justify-center px-0'
                } ${
                  vistaActual === item.id
                    ? 'bg-[#B82B71] text-white shadow-sm font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icono}</span>
                {menuAbierto && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* PIE DE PÁGINA CON PERFIL Y CERRAR SESIÓN */}
        <div className="pt-4 border-t border-gray-100 w-full">
          {menuAbierto && (
            <div className="mb-3 px-2">
              <p className="text-xs font-bold text-gray-900 truncate">
                {usuario.nombre} {usuario.apellido_paterno}
              </p>
              <p className="text-[11px] text-[#B82B71] capitalize font-medium">
                {usuario.rol}
              </p>
            </div>
          )}
          <button
            onClick={handleCerrarSesion}
            title={!menuAbierto ? 'Cerrar sesión' : ''}
            className={`w-full py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center ${
              menuAbierto ? 'px-3 gap-2 text-left' : 'justify-center px-0'
            }`}
          >
            <span className="text-base flex-shrink-0">🚪</span>
            {menuAbierto && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL (ÚNICO ELEMENTO CON SCROLL) */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
        {vistaActual === 'clientes' && <Clientes />}
        {vistaActual === 'cotizaciones' && <Cotizaciones />}
        {vistaActual === 'catalogo' && <Catalogo />}
        {vistaActual === 'usuarios' && <Usuarios />}
        {vistaActual === 'citas' && <Citas />}
        {vistaActual === 'dashboard' && <Dashboard setModuloActivo={setVistaActual} />}
      </main>

    </div>
  );
}

export default App;
import React from 'react';
import { MODULOS_CRM, PERMISOS_POR_ROL } from '../config/permisos';

const Sidebar = ({ vistaActual, setVistaActual, usuarioLogueado, onCerrarSesion }) => {
  const rolActual = usuarioLogueado?.rol || 'manicurista';
  
  const modulosPermitidos = MODULOS_CRM.filter((m) =>
    (PERMISOS_POR_ROL[rolActual] || []).includes(m.id)
  );

  const obtenerIniciales = (nombre, apellido) => {
    const n = nombre ? nombre[0] : '';
    const a = apellido ? apellido[0] : '';
    return (n + a).toUpperCase() || 'U';
  };

  const getRolEtiqueta = (rol) => {
    switch (rol) {
      case 'administradora': return 'Administradora';
      case 'recepcion': return 'Recepción';
      case 'manicurista': return 'Manicurista / Técnica';
      default: return 'Personal';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-screen sticky top-0">
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#B82B71] text-white flex items-center justify-center font-bold">N</div>
          <span className="font-bold text-gray-900 text-lg">Atenea Studio</span>
        </div>

        <div className="px-4 mt-2">
          <p className="text-xs font-semibold text-gray-400 mb-3 px-2 tracking-wider">MÓDULOS</p>
          <nav className="space-y-1">
            {modulosPermitidos.map((m) => {
              const esActivo = vistaActual === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setVistaActual(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    esActivo
                      ? 'bg-[#FDF2F8] text-[#B82B71] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      esActivo ? 'bg-[#B82B71]' : 'bg-gray-300'
                    }`}
                  ></span>
                  {m.nombre}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#FDF2F8] text-[#B82B71] flex items-center justify-center font-bold text-sm border border-[#fbcfe8]">
              {obtenerIniciales(usuarioLogueado?.nombre, usuarioLogueado?.apellido_paterno)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">
                {usuarioLogueado ? `${usuarioLogueado.nombre} ${usuarioLogueado.apellido_paterno || ''}` : 'Cargando...'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getRolEtiqueta(usuarioLogueado?.rol)}
              </p>
            </div>
          </div>
        </div>

        {onCerrarSesion && (
          <button
            onClick={onCerrarSesion}
            className="w-full mt-2 text-xs text-left text-gray-500 hover:text-[#B82B71] font-medium px-2 py-1 rounded hover:bg-gray-50 transition-colors"
          >
            ← Cerrar sesión / Cambiar perfil
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
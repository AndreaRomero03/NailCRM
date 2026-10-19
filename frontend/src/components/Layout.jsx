import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, vistaActual, setVistaActual, usuarioLogueado, onCerrarSesion }) => {
  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans">
      {/* Sidebar único reutilizado */}
      <Sidebar 
        vistaActual={vistaActual} 
        setVistaActual={setVistaActual} 
        usuarioLogueado={usuarioLogueado}
        onCerrarSesion={onCerrarSesion}
      />

      {/* Contenido dinámico de la pantalla activa */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;
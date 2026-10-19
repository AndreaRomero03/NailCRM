import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './Login';
import Usuarios from './Usuarios';
import Clientes from './Clientes'; // <-- Importar componente real
import { PERMISOS_POR_ROL, getVistaInicial } from './config/permisos';

// Vistas temporales restantes
const DashboardTemp = () => <div className="p-8"><h1 className="text-2xl font-bold text-gray-900">Módulo Dashboard</h1><p className="text-gray-500 mt-2">Visión global de métricas e indicadores.</p></div>;
const CotizacionesTemp = () => <div className="p-8"><h1 className="text-2xl font-bold text-gray-900">Módulo Cotizaciones</h1><p className="text-gray-500 mt-2">Generación de propuestas.</p></div>;
const CitasTemp = () => <div className="p-8"><h1 className="text-2xl font-bold text-gray-900">Módulo Citas</h1><p className="text-gray-500 mt-2">Agenda semanal.</p></div>;
const CatalogoTemp = () => <div className="p-8"><h1 className="text-2xl font-bold text-gray-900">Módulo Catálogo</h1><p className="text-gray-500 mt-2">Servicios base y tarifas.</p></div>;
const HistorialTemp = () => <div className="p-8"><h1 className="text-2xl font-bold text-gray-900">Módulo Historial del Cliente</h1><p className="text-gray-500 mt-2">Expediente histórico de visitas.</p></div>;

function App() {
  const [usuarioSesion, setUsuarioSesion] = useState(null);
  const [vistaActual, setVistaActual] = useState('clientes');
  const [comprobandoSesion, setComprobandoSesion] = useState(true);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('nailcrm_usuario');
    const tokenGuardado = localStorage.getItem('nailcrm_token');

    if (usuarioGuardado && tokenGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        setUsuarioSesion(usuario);
        setVistaActual(getVistaInicial(usuario.rol));
      } catch (e) {
        localStorage.removeItem('nailcrm_usuario');
        localStorage.removeItem('nailcrm_token');
      }
    }
    setComprobandoSesion(false);
  }, []);

  useEffect(() => {
    if (usuarioSesion) {
      const permitidos = PERMISOS_POR_ROL[usuarioSesion.rol] || [];
      if (!permitidos.includes(vistaActual)) {
        setVistaActual(getVistaInicial(usuarioSesion.rol));
      }
    }
  }, [usuarioSesion, vistaActual]);

  const handleLoginExitoso = (usuario) => {
    setUsuarioSesion(usuario);
    setVistaActual(getVistaInicial(usuario.rol));
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('nailcrm_usuario');
    localStorage.removeItem('nailcrm_token');
    setUsuarioSesion(null);
  };

  if (comprobandoSesion) {
    return (
      <div className="h-screen bg-[#FAF9F8] flex items-center justify-center font-sans text-gray-500 text-sm">
        Cargando CRM Atenea Studio...
      </div>
    );
  }

  if (!usuarioSesion) {
    return <Login onLoginExitoso={handleLoginExitoso} />;
  }

  const renderPantalla = () => {
    const permitidos = PERMISOS_POR_ROL[usuarioSesion.rol] || [];
    if (!permitidos.includes(vistaActual)) {
      return (
        <div className="p-12 text-center">
          <div className="inline-block p-4 bg-red-50 text-red-600 rounded-full mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900">Acceso no autorizado</h2>
          <p className="text-sm text-gray-500 mt-1">Tu rol no tiene permisos para acceder a esta sección.</p>
        </div>
      );
    }

    switch (vistaActual) {
      case 'dashboard': return <DashboardTemp />;
      case 'clientes': return <Clientes />; // <-- Módulo real conectado
      case 'cotizaciones': return <CotizacionesTemp />;
      case 'citas': return <CitasTemp />;
      case 'catalogo': return <CatalogoTemp />;
      case 'historial': return <HistorialTemp />;
      case 'usuarios': return <Usuarios />;
      default: return <Clientes />;
    }
  };

  return (
    <Layout 
      vistaActual={vistaActual} 
      setVistaActual={setVistaActual} 
      usuarioLogueado={usuarioSesion}
      onCerrarSesion={handleCerrarSesion}
    >
      {renderPantalla()}
    </Layout>
  );
}

export default App;
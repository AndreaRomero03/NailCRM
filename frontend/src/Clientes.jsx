import React, { useState, useEffect } from 'react';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Navegación de submódulo: 'lista' | 'expediente'
  const [vistaSubmodulo, setVistaSubmodulo] = useState('lista');

  // Estados de interfaz y filtrado en lista
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);

  // Estado para el Expediente Secundario
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [datosHistorial, setDatosHistorial] = useState({ cotizaciones: [], citas: [] });
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  const [pestanaExpediente, setPestanaExpediente] = useState('citas'); // 'citas' | 'cotizaciones'

  // Formulario alineado al esquema oficial exacto de la base de datos
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    fecha_nacimiento: '',
    alergia: false,
    nombre_contacto_emergencia: '',
    telefono_contacto_emergencia: '',
    preferencias: '',
    tipo: 'nueva',
    observaciones: '',
  });

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const res = await fetch('http://localhost:5000/api/clientes');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${res.status}: ${res.statusText})`);
      }
      const data = await res.json();
      setClientes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Entrar al Submódulo Secundario: Expediente de la Clienta
  const handleAbrirExpediente = async (cliente) => {
    setClienteSeleccionado(cliente);
    setVistaSubmodulo('expediente');
    setCargandoExpediente(true);

    try {
      const res = await fetch(`http://localhost:5000/api/clientes/${cliente.id}/historial`);
      if (res.ok) {
        const data = await res.json();
        setDatosHistorial({
          cotizaciones: data.cotizaciones || [],
          citas: data.citas || []
        });
      } else {
        alert('No se pudo cargar el expediente de la clienta.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al obtener el expediente.');
    } finally {
      setCargandoExpediente(false);
    }
  };

  const handleVolverALista = () => {
    setVistaSubmodulo('lista');
    setClienteSeleccionado(null);
  };

  const handleAbrirCrear = () => {
    setClienteEditar(null);
    setFormData({
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      telefono: '',
      fecha_nacimiento: '',
      alergia: false,
      nombre_contacto_emergencia: '',
      telefono_contacto_emergencia: '',
      preferencias: '',
      tipo: 'nueva',
      observaciones: '',
    });
    setModalAbierto(true);
  };

  const handleAbrirEditar = (cliente) => {
    setClienteEditar(cliente);
    let fechaFormateada = '';
    if (cliente.fecha_nacimiento) {
      fechaFormateada = new Date(cliente.fecha_nacimiento).toISOString().split('T')[0];
    }

    setFormData({
      nombre: cliente.nombre || '',
      apellido_paterno: cliente.apellido_paterno || '',
      apellido_materno: cliente.apellido_materno || '',
      telefono: cliente.telefono || '',
      fecha_nacimiento: fechaFormateada,
      alergia: Boolean(cliente.alergia),
      nombre_contacto_emergencia: cliente.nombre_contacto_emergencia || '',
      telefono_contacto_emergencia: cliente.telefono_contacto_emergencia || '',
      preferencias: cliente.preferencias || '',
      tipo: cliente.tipo || 'nueva',
      observaciones: cliente.observaciones || '',
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const esEdicion = !!clienteEditar;
    const url = esEdicion
      ? `http://localhost:5000/api/clientes/${clienteEditar.id}`
      : 'http://localhost:5000/api/clientes';
    const method = esEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalAbierto(false);
        cargarClientes();
        if (vistaSubmodulo === 'expediente' && clienteSeleccionado) {
          setClienteSeleccionado((prev) => ({ ...prev, ...formData }));
        }
      } else {
        let mensajeError = 'No se pudo guardar la clienta.';
        try {
          const errData = await res.json();
          mensajeError = errData.error || mensajeError;
        } catch (_) {
          mensajeError = `Error del servidor (${res.status}: ${res.statusText})`;
        }
        alert(`Error de base de datos: ${mensajeError}`);
      }
    } catch (err) {
      console.error('Error al guardar clienta:', err);
      alert('Error de conexión con el servidor backend en http://localhost:5000.');
    }
  };

  // Filtrado por búsqueda y pestaña de tipo
  const clientesCoincidentes = clientes.filter((c) => {
    const nombreCompleto = `${c.nombre || ''} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}`.toLowerCase();
    const coincideBusqueda =
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      (c.telefono && c.telefono.includes(busqueda));

    const coincideTipo = filtroTipo === 'todas' || c.tipo === filtroTipo;
    return coincideBusqueda && coincideTipo;
  });

  // Limitar a 10 por defecto cuando no hay texto en el buscador
  const hayBusquedaActiva = busqueda.trim().length > 0;
  const clientesMostrados = hayBusquedaActiva
    ? clientesCoincidentes
    : clientesCoincidentes.slice(0, 10);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  const formatearFechaHora = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  const renderBadgeTipo = (tipo) => {
    if (tipo === 'recurrente') {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
          Recurrente
        </span>
      );
    }
    if (tipo === 'esporadica') {
      return (
        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
          Esporádica
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-[#FDF2F8] text-[#B82B71] border border-pink-200 rounded-full text-xs font-medium">
        Nueva
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6 font-sans">
      
      {/* ========================================================================= */}
      {/* SUBMÓDULO SECUNDARIO: EXPEDIENTE COMPLETO DE LA CLIENTA                  */}
      {/* ========================================================================= */}
      {vistaSubmodulo === 'expediente' && clienteSeleccionado ? (
        <div className="space-y-6">
          
          {/* CABECERA Y NAVEGACIÓN */}
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="space-y-1">
              <button
                onClick={handleVolverALista}
                className="text-xs font-semibold text-[#B82B71] hover:text-[#9d2460] flex items-center gap-1 transition-colors mb-2"
              >
                ← Volver a la Lista de Clientes
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Expediente: {clienteSeleccionado.nombre} {clienteSeleccionado.apellido_paterno} {clienteSeleccionado.apellido_materno}
              </h1>
              <p className="text-xs text-gray-500 font-mono">
                📞 WhatsApp: {clienteSeleccionado.telefono} | Fecha Nacimiento: <strong className="text-gray-700">{formatearFecha(clienteSeleccionado.fecha_nacimiento)}</strong> | Clasificación: <span className="capitalize font-bold text-[#B82B71]">{clienteSeleccionado.tipo === 'esporadica' ? 'Esporádica' : clienteSeleccionado.tipo}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAbrirEditar(clienteSeleccionado)}
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                ✏️ Editar Expediente Completo
              </button>
            </div>
          </div>

          {/* TARJETAS DE INFORMACIÓN CLÍNICA, BIOSEGURIDAD Y OBSERVACIONES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* ALERGIAS Y BIOSEGURIDAD */}
            <div className={`p-5 rounded-2xl border ${
              clienteSeleccionado.alergia 
                ? 'bg-rose-50/80 border-rose-200 text-rose-900' 
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">Alergias Técnicas</p>
              <p className="text-sm font-bold">
                {clienteSeleccionado.alergia ? '⚠️ Alergia reportada (Acrílico, monómero, látex, etc.)' : '✅ Sin alergias conocidas'}
              </p>
            </div>

            {/* CONTACTO DE EMERGENCIA */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contacto de Emergencia</p>
              <p className="text-sm font-bold text-gray-800">{clienteSeleccionado.nombre_contacto_emergencia || 'No asignado'}</p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{clienteSeleccionado.telefono_contacto_emergencia || 'Sin teléfono'}</p>
            </div>

            {/* PREFERENCIAS DEL SERVICIO */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Preferencias y Estilo</p>
              <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap">{clienteSeleccionado.preferencias || 'Sin preferencias registradas'}</p>
            </div>

            {/* OBSERVACIONES ADICIONALES DE LA UÑA */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Observaciones Técnicas</p>
              <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap">{clienteSeleccionado.observaciones || 'Sin observaciones guardadas'}</p>
            </div>

          </div>

          {/* HISTORIAL DE CITAS Y COTIZACIONES EN PESTAÑAS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            
            <div className="flex border-b border-gray-100 gap-6 text-sm font-bold">
              <button
                onClick={() => setPestanaExpediente('citas')}
                className={`pb-3 border-b-2 transition-colors ${
                  pestanaExpediente === 'citas' ? 'border-[#B82B71] text-[#B82B71]' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                📅 Citas Agendadas ({datosHistorial.citas.length})
              </button>
              <button
                onClick={() => setPestanaExpediente('cotizaciones')}
                className={`pb-3 border-b-2 transition-colors ${
                  pestanaExpediente === 'cotizaciones' ? 'border-[#B82B71] text-[#B82B71]' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                📄 Histórico de Cotizaciones ({datosHistorial.cotizaciones.length})
              </button>
            </div>

            {cargandoExpediente ? (
              <div className="py-8 text-center text-xs text-gray-400">Cargando historial del expediente...</div>
            ) : pestanaExpediente === 'citas' ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F8] text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Folio Cotización</th>
                    <th className="px-4 py-3">Manicurista</th>
                    <th className="px-4 py-3">Fecha Inicio</th>
                    <th className="px-4 py-3">Fecha Fin</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {datosHistorial.citas.map((cita, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-[#B82B71]">{cita.folio_cotizacion}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">💅 {cita.manicurista_nombre || 'Sin asignar'}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{formatearFechaHora(cita.fecha_hora_inicio)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatearFechaHora(cita.fecha_hora_fin)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">${Number(cita.total).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          cita.estado === 'completada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          cita.estado === 'programada' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {cita.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {datosHistorial.citas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-400">Esta clienta aún no tiene citas agendadas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F8] text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Folio</th>
                    <th className="px-4 py-3">Fecha Emisión</th>
                    <th className="px-4 py-3">Duración Est.</th>
                    <th className="px-4 py-3">Monto Total</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {datosHistorial.cotizaciones.map((cot, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-[#B82B71]">{cot.folio}</td>
                      <td className="px-4 py-3 text-gray-600">{formatearFecha(cot.fecha_emision)}</td>
                      <td className="px-4 py-3 text-gray-700">⏱️ {cot.duracion_estimada_minutos} min</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">${Number(cot.total).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          cot.estado === 'aceptada' ? 'bg-emerald-50 text-emerald-700' :
                          cot.estado === 'pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {cot.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {datosHistorial.cotizaciones.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-400">Esta clienta aún no cuenta con cotizaciones.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

          </div>

        </div>
      ) : (

        /* ========================================================================= */
        /* VISTA PRINCIPAL: TABLA DE CLIENTES                                       */
        /* ========================================================================= */
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-sm text-gray-500">Expediente completo de clientas, fechas especiales, alergias y emergencias</p>
            </div>
            <button
              onClick={handleAbrirCrear}
              className="bg-[#B82B71] hover:bg-[#9d2460] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>+</span> Nueva clienta
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <strong>Error de conexión:</strong> {error}
            </div>
          )}

          {/* TARJETAS KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Clientas</p>
              <p className="text-3xl font-bold text-gray-900">{clientes.length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Clientas Nuevas</p>
              <p className="text-3xl font-bold text-[#B82B71]">
                {clientes.filter((c) => c.tipo === 'nueva').length}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Clientas Recurrentes</p>
              <p className="text-3xl font-bold text-emerald-600">
                {clientes.filter((c) => c.tipo === 'recurrente').length}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Clientas Esporádicas</p>
              <p className="text-3xl font-bold text-amber-600">
                {clientes.filter((c) => c.tipo === 'esporadica').length}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Con Alergias</p>
              <p className="text-3xl font-bold text-rose-600">
                {clientes.filter((c) => c.alergia).length}
              </p>
            </div>
          </div>

          {/* BARRA BÚSQUEDA */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Buscar cualquier clienta por nombre o teléfono (WhatsApp)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B82B71]"
              />
            </div>

            <div className="flex gap-2 text-sm">
              {[
                { label: 'Todas', value: 'todas' },
                { label: 'Recurrentes', value: 'recurrente' },
                { label: 'Nuevas', value: 'nueva' },
                { label: 'Esporádicas', value: 'esporadica' },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFiltroTipo(btn.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filtroTipo === btn.value
                      ? 'bg-[#B82B71] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* INDICADOR DE TOP 10 */}
          {!hayBusquedaActiva && clientesCoincidentes.length > 10 && (
            <div className="text-xs text-gray-500 flex justify-between items-center px-1">
              <span>
                Mostrando el <strong>Top 10</strong> de clientas con mayor frecuencia de citas ({clientesMostrados.length} de {clientesCoincidentes.length} en esta vista). Usa el buscador para localizar a cualquier otra clienta.
              </span>
            </div>
          )}

          {/* TABLA PRINCIPAL */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {cargando ? (
              <div className="p-8 text-center text-gray-500">Cargando expediente de clientas...</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF9F8] text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Nombre completo</th>
                    <th className="px-6 py-3.5 font-medium">Teléfono (WhatsApp)</th>
                    <th className="px-6 py-3.5 font-medium">Fecha Nac.</th>
                    <th className="px-6 py-3.5 font-medium">Tipo</th>
                    <th className="px-6 py-3.5 font-medium">Citas</th>
                    <th className="px-6 py-3.5 font-medium">Alergias</th>
                    <th className="px-6 py-3.5 font-medium">Contacto Emergencia</th>
                    <th className="px-6 py-3.5 font-medium">Preferencias</th>
                    <th className="px-6 py-3.5 font-medium">Observaciones</th>
                    <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {clientesMostrados.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {c.nombre} {c.apellido_paterno} {c.apellido_materno}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-800">
                        {c.telefono}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {formatearFecha(c.fecha_nacimiento)}
                      </td>
                      <td className="px-6 py-4">
                        {renderBadgeTipo(c.tipo)}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-gray-700">
                        {c.total_citas ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        {c.alergia ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                            ⚠️ Sí presenta
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-gray-400 text-xs">Sin alergias</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {c.nombre_contacto_emergencia ? (
                          <div>
                            <p className="font-semibold text-gray-800">{c.nombre_contacto_emergencia}</p>
                            <p className="font-mono text-gray-500">{c.telefono_contacto_emergencia || 'Sin teléfono'}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 max-w-[200px] break-words whitespace-normal max-h-24 overflow-y-auto">
                        {c.preferencias || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 max-w-[200px] break-words whitespace-normal max-h-24 overflow-y-auto">
                        {c.observaciones || '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleAbrirExpediente(c)}
                          className="text-xs px-2.5 py-1.5 bg-pink-50 text-[#B82B71] border border-pink-200 rounded-md hover:bg-pink-100 transition-colors font-semibold"
                        >
                          📋 Expediente
                        </button>
                        <button
                          onClick={() => handleAbrirEditar(c)}
                          className="text-xs px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {clientesMostrados.length === 0 && (
                    <tr>
                      <td colSpan="10" className="px-6 py-8 text-center text-gray-400">
                        No se encontraron clientas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* MODAL CREAR / EDITAR CLIENTA */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {clienteEditar ? 'Editar datos de la clienta' : 'Registrar nueva clienta'}
                </h3>
                <p className="text-xs text-gray-500">Expediente técnico e información general</p>
              </div>
              <button 
                onClick={() => setModalAbierto(false)} 
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre(s) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                    placeholder="Ej. Beatriz"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido Paterno</label>
                    <input
                      type="text"
                      value={formData.apellido_paterno}
                      onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                      placeholder="Ej. Romero"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido Materno</label>
                    <input
                      type="text"
                      value={formData.apellido_materno}
                      onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                      placeholder="Ej. Servín"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono *</label>
                    <input
                      type="text"
                      required
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                      placeholder="5551380858"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Nac.</label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo (Automático)</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={
                        formData.tipo === 'recurrente'
                          ? 'Recurrente'
                          : formData.tipo === 'esporadica'
                          ? 'Esporádica'
                          : 'Nueva'
                      }
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.alergia}
                      onChange={(e) => setFormData({ ...formData, alergia: e.target.checked })}
                      className="w-4 h-4 text-[#B82B71] rounded focus:ring-[#B82B71]"
                    />
                    <span className="font-semibold text-xs text-rose-900">
                      ¿La clienta presenta alguna alergia conocida? (Acrílico, monómero, látex, etc.)
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-gray-800 mb-2 border-b pb-1">Contacto de Emergencia</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de contacto</label>
                      <input
                        type="text"
                        value={formData.nombre_contacto_emergencia}
                        onChange={(e) => setFormData({ ...formData, nombre_contacto_emergencia: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                        placeholder="Ej. Familiar / Esposo"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono emergencia</label>
                      <input
                        type="text"
                        value={formData.telefono_contacto_emergencia}
                        onChange={(e) => setFormData({ ...formData, telefono_contacto_emergencia: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                        placeholder="5598765432"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Preferencias del Servicio</label>
                    <input
                      type="text"
                      value={formData.preferencias}
                      onChange={(e) => setFormData({ ...formData, preferencias: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                      placeholder="Largo almendrado, tonos neutros, efecto espejo, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Observaciones adicionales</label>
                    <textarea
                      rows="2"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                      placeholder="Detalles sobre el estado de la uña natural, productos anteriores, etc."
                    ></textarea>
                  </div>
                </div>

              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B82B71] hover:bg-[#9d2460] text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  {clienteEditar ? 'Guardar cambios' : 'Registrar clienta'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Clientes;
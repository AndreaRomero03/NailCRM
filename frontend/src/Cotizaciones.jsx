import React, { useState, useEffect } from 'react';

const Cotizaciones = () => {
  // Datos principales
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);

  // Estados de interfaz
  const [vista, setVista] = useState('historial'); // 'historial' | 'nueva'
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [busquedaServicio, setBusquedaServicio] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');

  // Formulario y Buscador de Clientas
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  const [detallesSeleccionados, setDetallesSeleccionados] = useState([]);

  // Modal para ver información completa
  const [cotizacionVer, setCotizacionVer] = useState(null);
  const [detallesVer, setDetallesVer] = useState([]);
  const [cargandoModal, setCargandoModal] = useState(false);

  // Fechas min (hoy) y max (+5 días)
  const hoyISO = new Date().toISOString().slice(0, 10);
  const maxFechaObj = new Date();
  maxFechaObj.setDate(maxFechaObj.getDate() + 5);
  const maxISO = maxFechaObj.toISOString().slice(0, 10);

  const [fechaVencimiento, setFechaVencimiento] = useState(hoyISO);

  // Formateador seguro de fechas
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    try {
      const parteFecha = String(fechaStr).split('T')[0];
      const [year, month, day] = parteFecha.split('-');
      if (!year || !month || !day) return '-';
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '-';
    }
  };

  // Cargar datos iniciales
  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [resCot, resCli, resCat, resServ] = await Promise.all([
        fetch('http://localhost:5000/api/cotizaciones'),
        fetch('http://localhost:5000/api/clientes'),
        fetch('http://localhost:5000/api/catalogo/categorias'),
        fetch('http://localhost:5000/api/catalogo/elementos')
      ]);

      if (resCot.ok) setCotizaciones(await resCot.json());
      if (resCli.ok) setClientes(await resCli.json());
      if (resCat.ok) setCategorias(await resCat.json());
      if (resServ.ok) setServicios(await resServ.json());

      setError(null);
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // Mapeo auxiliar de Categorías por ID
  const mapaCategorias = {};
  categorias.forEach((c) => {
    mapaCategorias[c.id] = c.nombre;
  });

  // Ver detalle completo en Modal
  const handleAbrirDetalle = async (folio) => {
    try {
      setCargandoModal(true);
      const res = await fetch(`http://localhost:5000/api/cotizaciones/${folio}`);
      if (res.ok) {
        const data = await res.json();
        setCotizacionVer(data.cotizacion);
        setDetallesVer(data.detalles);
      } else {
        alert('No se pudo obtener la información de esta cotización.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setCargandoModal(false);
    }
  };

  // Agregar servicio al desglose
  const handleAgregarServicio = (servicio) => {
    const existe = detallesSeleccionados.find((d) => d.elemento_id === servicio.id);
    if (existe) return;

    setDetallesSeleccionados((prev) => [
      ...prev,
      {
        elemento_id: servicio.id,
        concepto: servicio.concepto,
        cantidad: 1,
        precio_unitario: Number(servicio.precio),
        duracion_minutos: Number(servicio.duracion_minutos || 0),
        subtotal: Number(servicio.precio)
      }
    ]);
  };

  // Ajustar cantidad (1 a 10)
  const handleCambiarCantidad = (index, delta) => {
    setDetallesSeleccionados((prev) => {
      const copia = [...prev];
      const nuevaCant = Math.max(1, Math.min(10, copia[index].cantidad + delta));
      copia[index].cantidad = nuevaCant;
      copia[index].subtotal = copia[index].precio_unitario * nuevaCant;
      return copia;
    });
  };

  const handleEliminarDetalle = (index) => {
    setDetallesSeleccionados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCambiarEstado = async (folio, nuevoEstado) => {
    try {
      const res = await fetch(`http://localhost:5000/api/cotizaciones/${folio}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (res.ok) {
        cargarTodo();
        if (cotizacionVer && cotizacionVer.folio === folio) {
          setCotizacionVer((prev) => ({ ...prev, estado: nuevoEstado }));
        }
      } else {
        alert('No se pudo cambiar el estado de la cotización.');
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  const totalMonto = detallesSeleccionados.reduce((sum, d) => sum + d.subtotal, 0);
  const totalDuracionMinutos = detallesSeleccionados.reduce((sum, d) => sum + (d.duracion_minutos * d.cantidad), 0);

  const handleGuardarCotizacion = async () => {
    if (!clienteSeleccionado) return alert('Por favor selecciona una clienta.');
    if (!fechaVencimiento) return alert('La fecha de vencimiento es obligatoria.');
    if (fechaVencimiento < hoyISO || fechaVencimiento > maxISO) {
      return alert('La fecha de vencimiento debe ser como máximo 5 días naturales a partir de hoy.');
    }
    if (detallesSeleccionados.length === 0) return alert('Agrega al menos un servicio al desglose.');

    try {
      const res = await fetch('http://localhost:5000/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteSeleccionado.id,
          duracion_estimada_minutos: totalDuracionMinutos,
          total: totalMonto,
          fecha_vencimiento: fechaVencimiento,
          detalles: detallesSeleccionados
        })
      });

      if (res.ok) {
        setClienteSeleccionado(null);
        setBusquedaCliente('');
        setFechaVencimiento(hoyISO);
        setDetallesSeleccionados([]);
        setVista('historial');
        cargarTodo();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo guardar la cotización'}`);
      }
    } catch (err) {
      alert('Error de conexión con el servidor backend.');
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    const completo = `${c.nombre || ''} ${c.apellido_paterno || ''} ${c.telefono || ''}`.toLowerCase();
    return completo.includes(busquedaCliente.toLowerCase());
  });

  const serviciosFiltrados = servicios
    .filter((s) => s.activo)
    .filter((s) => categoriaActiva === 'todas' || String(s.categoria_id) === String(categoriaActiva))
    .filter((s) => s.concepto.toLowerCase().includes(busquedaServicio.toLowerCase()));

  const cotizacionesFiltradas = cotizaciones.filter((c) =>
    `${c.folio || ''} ${c.cliente_nombre || ''} ${c.cliente_apellido || ''}`
      .toLowerCase()
      .includes(busquedaHistorial.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 font-sans">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones & Presupuestos</h1>
          <p className="text-sm text-gray-500">Generación de presupuestos, desgloses por técnica y cálculo de adicionales por uña</p>
        </div>
        <div>
          {vista === 'historial' ? (
            <button
              onClick={() => {
                setFechaVencimiento(hoyISO);
                setVista('nueva');
              }}
              className="bg-[#B82B71] hover:bg-[#9d2460] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>+</span> Nueva Cotización
            </button>
          ) : (
            <button
              onClick={() => setVista('historial')}
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              ← Volver al Historial
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Cotizaciones</p>
          <p className="text-3xl font-bold text-gray-900">{cotizaciones.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Pendientes</p>
          <p className="text-3xl font-bold text-amber-600">
            {cotizaciones.filter((c) => c.estado === 'pendiente').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Aceptadas</p>
          <p className="text-3xl font-bold text-emerald-600">
            {cotizaciones.filter((c) => c.estado === 'aceptada').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Rechazadas</p>
          <p className="text-3xl font-bold text-rose-600">
            {cotizaciones.filter((c) => c.estado === 'rechazada').length}
          </p>
        </div>
      </div>

      {/* VISTA 1: NUEVA COTIZACIÓN */}
      {vista === 'nueva' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  1. Seleccionar Clienta *
                </label>

                {!clienteSeleccionado ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Buscar clienta por nombre o teléfono..."
                      value={busquedaCliente}
                      onFocus={() => setMostrarListaClientes(true)}
                      onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setMostrarListaClientes(true);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B82B71] transition-colors"
                    />

                    {mostrarListaClientes && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-gray-50">
                        {clientesFiltrados.map((cli) => (
                          <div
                            key={cli.id}
                            onClick={() => {
                              setClienteSeleccionado(cli);
                              setMostrarListaClientes(false);
                              setBusquedaCliente('');
                            }}
                            className="p-3 hover:bg-pink-50/50 cursor-pointer transition-colors flex justify-between items-center"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {cli.nombre} {cli.apellido_paterno} {cli.apellido_materno}
                              </p>
                              <p className="text-xs text-gray-500">📞 {cli.telefono || 'Sin teléfono'}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize font-medium">
                              {cli.tipo || 'recurrente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-pink-50/40 border border-pink-200 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#B82B71] text-white rounded-full flex items-center justify-center font-bold text-xs">
                        {clienteSeleccionado.nombre ? clienteSeleccionado.nombre.charAt(0) : 'C'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {clienteSeleccionado.nombre} {clienteSeleccionado.apellido_paterno}
                        </p>
                        <p className="text-[11px] text-gray-500">📞 {clienteSeleccionado.telefono || 'Sin teléfono'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setClienteSeleccionado(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 bg-white border border-rose-200 rounded-lg transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Vencimiento *
                </label>
                <input
                  type="date"
                  required
                  min={hoyISO}
                  max={maxISO}
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#B82B71]"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* PASO 2: CATÁLOGO DE SERVICIOS */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  2. Catálogo de Servicios y Adicionales
                </label>
                <input
                  type="text"
                  placeholder="Buscar servicio..."
                  value={busquedaServicio}
                  onChange={(e) => setBusquedaServicio(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#B82B71] w-48"
                />
              </div>

              {/* Pestañas de Categorías */}
              <div className="flex gap-2 pb-2 mb-3 overflow-x-auto border-b border-gray-100">
                <button
                  onClick={() => setCategoriaActiva('todas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    categoriaActiva === 'todas'
                      ? 'bg-[#B82B71] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Todas
                </button>
                {categorias.filter(c => c.activo).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaActiva(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      String(categoriaActiva) === String(cat.id)
                        ? 'bg-[#B82B71] text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>

              {/* Grid de Servicios con Etiqueta de Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {serviciosFiltrados.map((s) => {
                  const yaAgregado = detallesSeleccionados.some((d) => d.elemento_id === s.id);
                  const nombreCategoria = mapaCategorias[s.categoria_id] || 'General';

                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-xl border flex justify-between items-center transition-all ${
                        yaAgregado
                          ? 'bg-pink-50/40 border-pink-200'
                          : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="space-y-1">
                        {/* Etiqueta / Badge de Categoría cuando se está en la pestaña "Todas" */}
                        {categoriaActiva === 'todas' && (
                          <span className="inline-block text-[10px] font-semibold bg-pink-50 text-[#B82B71] px-2 py-0.5 rounded-md">
                            {nombreCategoria}
                          </span>
                        )}
                        <p className="text-xs font-bold text-gray-900">{s.concepto}</p>
                        <p className="text-[11px] text-gray-500">
                          ⏱️ {s.duracion_minutos} min | <span className="font-semibold text-gray-800">${Number(s.precio).toFixed(2)}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleAgregarServicio(s)}
                        disabled={yaAgregado}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          yaAgregado
                            ? 'bg-gray-100 text-gray-400 cursor-default'
                            : 'bg-[#B82B71] hover:bg-[#9d2460] text-white shadow-sm'
                        }`}
                      >
                        {yaAgregado ? 'Añadido' : '+ Añadir'}
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* DESGLOSE EN PANEL DERECHO */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-base font-bold text-gray-900">Desglose de Cotización</h3>
                <span className="text-xs bg-pink-50 text-[#B82B71] px-2.5 py-1 rounded-full font-semibold">
                  {detallesSeleccionados.length} elemento(s)
                </span>
              </div>

              {detallesSeleccionados.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs space-y-2">
                  <p className="text-2xl">💅</p>
                  <p>Selecciona servicios del catálogo para armar el presupuesto.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {detallesSeleccionados.map((item, index) => (
                    <div key={index} className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-gray-900">{item.concepto}</span>
                        <button
                          onClick={() => handleEliminarDetalle(index)}
                          className="text-gray-400 hover:text-rose-600 text-xs font-bold transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-gray-500">Cantidad (Uñas/Servicios):</span>
                        <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleCambiarCantidad(index, -1)}
                            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-bold text-gray-900">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => handleCambiarCantidad(index, 1)}
                            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200/50">
                        <span className="text-gray-400">${item.precio_unitario.toFixed(2)} c/u</span>
                        <span className="font-mono font-bold text-gray-900">${item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Tiempo Estimado Total:</span>
                <span className="font-bold text-gray-900">⏱️ {totalDuracionMinutos} minutos</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Total Cotizado:</span>
                <span className="text-[#B82B71] text-2xl font-mono">${totalMonto.toFixed(2)}</span>
              </div>

              <button
                onClick={handleGuardarCotizacion}
                disabled={detallesSeleccionados.length === 0}
                className="w-full bg-[#B82B71] hover:bg-[#9d2460] text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                Guardar Cotización
              </button>
            </div>

          </div>

        </div>
      )}

      {/* VISTA 2: HISTORIAL DE COTIZACIONES */}
      {vista === 'historial' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <input
              type="text"
              placeholder="Buscar por folio o clienta..."
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B82B71]"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {cargando ? (
              <div className="p-8 text-center text-gray-500">Cargando cotizaciones...</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF9F8] text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Folio</th>
                    <th className="px-6 py-3.5 font-medium">Clienta</th>
                    <th className="px-6 py-3.5 font-medium">Tiempo Estimado</th>
                    <th className="px-6 py-3.5 font-medium">Monto Total</th>
                    <th className="px-6 py-3.5 font-medium">Estado</th>
                    <th className="px-6 py-3.5 font-medium">Vencimiento</th>
                    <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {cotizacionesFiltradas.map((cot) => (
                    <tr key={cot.folio} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#B82B71]">
                        <button 
                          onClick={() => handleAbrirDetalle(cot.folio)}
                          className="hover:underline focus:outline-none"
                        >
                          {cot.folio}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {cot.cliente_nombre} {cot.cliente_apellido}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        ⏱️ {cot.duracion_estimada_minutos} min
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">
                        ${Number(cot.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          cot.estado === 'aceptada'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : cot.estado === 'pendiente'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {cot.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {formatearFecha(cot.fecha_vencimiento)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleAbrirDetalle(cot.folio)}
                          className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 font-medium transition-colors mr-1"
                        >
                          👁️ Ver
                        </button>

                        {cot.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleCambiarEstado(cot.folio, 'aceptada')}
                              className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 font-medium transition-colors"
                            >
                              Aceptar
                            </button>
                            <button
                              onClick={() => handleCambiarEstado(cot.folio, 'rechazada')}
                              className="text-xs px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100 font-medium transition-colors"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {cotizacionesFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                        No se encontraron cotizaciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* MODAL DETALLE COMPLETO DE LA COTIZACIÓN */}
      {(cotizacionVer || cargandoModal) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-fade-in">
            
            {cargandoModal ? (
              <div className="text-center py-12 text-gray-500">Cargando información...</div>
            ) : (
              <>
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-[#B82B71] uppercase tracking-wider">Detalle de Cotización</span>
                    <h3 className="text-xl font-mono font-bold text-gray-900">{cotizacionVer.folio}</h3>
                  </div>
                  <button
                    onClick={() => setCotizacionVer(null)}
                    className="text-gray-400 hover:text-gray-700 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Datos del Cliente y Fechas */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl text-xs">
                  <div>
                    <p className="text-gray-400">Clienta:</p>
                    <p className="font-bold text-gray-800 text-sm">
                      {cotizacionVer.nombre} {cotizacionVer.apellido_paterno}
                    </p>
                    <p className="text-gray-500 mt-0.5">📞 {cotizacionVer.telefono || 'Sin teléfono'}</p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-gray-400">Emisión:</span> <span className="font-medium text-gray-800">{formatearFecha(cotizacionVer.fecha_emision)}</span></p>
                    <p><span className="text-gray-400">Vencimiento:</span> <span className="font-medium text-gray-800">{formatearFecha(cotizacionVer.fecha_vencimiento)}</span></p>
                    <p>
                      <span className="text-gray-400">Estado: </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        cotizacionVer.estado === 'aceptada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cotizacionVer.estado === 'pendiente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {cotizacionVer.estado}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tabla de Servicios Cotizados */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Conceptos Cotizados</p>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl">
                    {detallesVer.map((det) => (
                      <div key={det.id} className="p-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{det.concepto}</p>
                          {det.categoria_nombre && (
                            <span className="text-[10px] text-[#B82B71] bg-pink-50 px-1.5 py-0.5 rounded font-medium">
                              {det.categoria_nombre}
                            </span>
                          )}
                          <p className="text-gray-400 mt-0.5">
                            {det.cantidad} unidad(es) × ${Number(det.precio_unitario).toFixed(2)}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          ${Number(det.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen Total */}
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">⏱️ Tiempo estimado: {cotizacionVer.duracion_estimada_minutos} min</span>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Total</span>
                    <span className="text-xl font-mono font-bold text-[#B82B71]">${Number(cotizacionVer.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {cotizacionVer.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleCambiarEstado(cotizacionVer.folio, 'aceptada')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Aceptar Cotización
                      </button>
                      <button
                        onClick={() => handleCambiarEstado(cotizacionVer.folio, 'rechazada')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setCotizacionVer(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Cotizaciones;
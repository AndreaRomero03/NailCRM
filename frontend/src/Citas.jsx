import React, { useState, useEffect } from 'react';

const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [cotizacionesAceptadas, setCotizacionesAceptadas] = useState([]);
  const [manicuristas, setManicuristas] = useState([]);

  // Vistas generales: 'calendario', 'historial' (lista), 'nueva'
  const [modoVista, setModoVista] = useState('calendario');
  // Subvista del calendario: 'mes' | 'semana'
  const [tipoCalendario, setTipoCalendario] = useState('mes');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Navegación de Fecha en Calendario
  const [fechaCalendario, setFechaCalendario] = useState(new Date());

  // Formulario Nueva Cita (Fecha y Hora separadas para bloqueo visual estricto en el calendario)
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [manicuristaId, setManicuristaId] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [horaCita, setHoraCita] = useState('');

  // Modal para ver/editar cita seleccionada
  const [citaSeleccionadaModal, setCitaSeleccionadaModal] = useState(null);

  // Calcular límites de agendamiento: mínimo mañana (no hoy) y máximo +30 días
  const obtenerLimitesAgendamiento = () => {
    const hoy = new Date();
    const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 0, 0, 0, 0);
    const max30 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 30, 23, 59, 59, 999);

    const aFormatoFechaInput = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    return {
      minDate: aFormatoFechaInput(manana),
      maxDate: aFormatoFechaInput(max30),
      mananaObj: manana,
      max30Obj: max30
    };
  };

  const { minDate, maxDate, mananaObj, max30Obj } = obtenerLimitesAgendamiento();

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [resCitas, resCot, resMani] = await Promise.all([
        fetch('http://localhost:5000/api/citas'),
        fetch('http://localhost:5000/api/citas/cotizaciones-aceptadas'),
        fetch('http://localhost:5000/api/citas/manicuristas')
      ]);

      if (resCitas.ok) setCitas(await resCitas.json());
      if (resCot.ok) setCotizacionesAceptadas(await resCot.json());
      if (resMani.ok) setManicuristas(await resMani.json());

      setError(null);
    } catch (err) {
      setError('Error al conectar con el servidor backend.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const formatearFechaHora = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const handleGuardarCita = async (e) => {
    e.preventDefault();
    if (!cotizacionSeleccionada) return alert('Selecciona una cotización aceptada.');
    if (!manicuristaId) return alert('Selecciona la manicurista encargada.');
    if (!fechaCita) return alert('Selecciona la fecha de la cita.');
    if (!horaCita) return alert('Selecciona la hora de inicio.');

    if (fechaCita < minDate) {
      return alert('No se permite agendar citas para el día actual ni fechas pasadas. Selecciona a partir de mañana.');
    }
    if (fechaCita > maxDate) {
      return alert('Solo puedes agendar citas con un máximo de 30 días después de la fecha actual.');
    }

    const fechaHoraInicio = `${fechaCita}T${horaCita}`;
    const fechaSeleccionadaObj = new Date(fechaHoraInicio);

    if (fechaSeleccionadaObj < mananaObj || fechaSeleccionadaObj > max30Obj) {
      return alert('La fecha seleccionada está fuera del rango permitido (mañana hasta 30 días).');
    }

    try {
      const res = await fetch('http://localhost:5000/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folio_cotizacion: cotizacionSeleccionada.folio,
          manicurista_id: manicuristaId,
          fecha_hora_inicio: fechaHoraInicio,
          estado: 'programada'
        })
      });

      if (res.ok) {
        setCotizacionSeleccionada(null);
        setManicuristaId('');
        setFechaCita('');
        setHoraCita('');
        setModoVista('calendario');
        cargarTodo();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo agendar la cita'}`);
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    }
  };

  const handleCambiarEstado = async (folio, nuevoEstado) => {
    try {
      const res = await fetch(`http://localhost:5000/api/citas/${folio}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (res.ok) {
        const citaActualizada = await res.json();
        cargarTodo(); // Recarga la lista/calendario
        
        if (citaSeleccionadaModal && citaSeleccionadaModal.folio_cotizacion === folio) {
          setCitaSeleccionadaModal((prev) => ({ ...prev, estado: citaActualizada.estado }));
        }
      } else {
        const err = await res.json();
        alert(`Error al actualizar estado: ${err.error || 'No se pudo cambiar el estado'}`);
      }
    } catch (err) {
      console.error('Error en petición PATCH:', err);
      alert('Error de conexión con el servidor backend.');
    }
  };

  // --- LÓGICA DE CALENDARIO MENSUAL ---
  const añoActual = fechaCalendario.getFullYear();
  const mesActual = fechaCalendario.getMonth();

  const primerDiaMes = new Date(añoActual, mesActual, 1).getDay();
  const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();

  const cambiarNavegacion = (delta) => {
    if (tipoCalendario === 'mes') {
      setFechaCalendario(new Date(añoActual, mesActual + delta, 1));
    } else {
      // Avanzar / Retroceder 7 días
      const nuevaFecha = new Date(fechaCalendario);
      nuevaFecha.setDate(nuevaFecha.getDate() + delta * 7);
      setFechaCalendario(nuevaFecha);
    }
  };

  const diasMatrizMes = [];
  for (let i = 0; i < primerDiaMes; i++) {
    diasMatrizMes.push(null);
  }
  for (let d = 1; d <= diasEnMes; d++) {
    diasMatrizMes.push(d);
  }

  // --- LÓGICA DE CALENDARIO SEMANAL ---
  const obtenerDiasSemana = (fechaRef) => {
    const diaSemana = fechaRef.getDay(); // 0: Domingo ... 6: Sábado
    const domingoInicial = new Date(fechaRef);
    domingoInicial.setDate(fechaRef.getDate() - diaSemana);

    const semana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(domingoInicial);
      dia.setDate(domingoInicial.getDate() + i);
      semana.push(dia);
    }
    return semana;
  };

  const diasSemanaActual = obtenerDiasSemana(fechaCalendario);

  const citasFiltradas = citas.filter((c) =>
    `${c.folio_cotizacion || ''} ${c.cliente_nombre || ''} ${c.cliente_apellido || ''} ${c.manicurista_nombre || ''}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 font-sans">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda & Citas</h1>
          <p className="text-sm text-gray-500">Programación de citas vinculadas a cotizaciones aceptadas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-lg flex gap-1 text-xs font-semibold">
            <button
              onClick={() => setModoVista('calendario')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                modoVista === 'calendario' ? 'bg-white text-[#B82B71] shadow-sm' : 'text-gray-600'
              }`}
            >
              📅 Calendario
            </button>
            <button
              onClick={() => setModoVista('historial')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                modoVista === 'historial' ? 'bg-white text-[#B82B71] shadow-sm' : 'text-gray-600'
              }`}
            >
              📋 Lista
            </button>
          </div>

          {modoVista !== 'nueva' ? (
            <button
              onClick={() => {
                cargarTodo();
                setModoVista('nueva');
              }}
              className="bg-[#B82B71] hover:bg-[#9d2460] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              + Agendar Cita
            </button>
          ) : (
            <button
              onClick={() => setModoVista('calendario')}
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              ← Volver
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <strong>Error de conexión:</strong> {error}
        </div>
      )}

      {/* VISTA 1: CALENDARIO (MES / SEMANA) */}
      {modoVista === 'calendario' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          
          {/* BARRA DE NAVEGACIÓN Y SELECTOR MES / SEMANA */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 capitalize">
                {tipoCalendario === 'mes'
                  ? fechaCalendario.toLocaleString('es-MX', { month: 'long', year: 'numeric' })
                  : `Semana del ${diasSemanaActual[0].getDate()} al ${diasSemanaActual[6].getDate()} de ${diasSemanaActual[6].toLocaleString('es-MX', { month: 'short', year: 'numeric' })}`}
              </h2>

              {/* Botones alternar Mes / Semana */}
              <div className="bg-gray-100 p-0.5 rounded-lg flex text-xs font-semibold">
                <button
                  onClick={() => setTipoCalendario('mes')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    tipoCalendario === 'mes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setTipoCalendario('semana')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    tipoCalendario === 'semana' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Semana
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => cambiarNavegacion(-1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 font-semibold"
              >
                ← {tipoCalendario === 'mes' ? 'Mes Anterior' : 'Semana Anterior'}
              </button>
              <button
                onClick={() => setFechaCalendario(new Date())}
                className="px-3 py-1.5 bg-pink-50 text-[#B82B71] rounded-lg text-xs font-semibold"
              >
                Hoy
              </button>
              <button
                onClick={() => cambiarNavegacion(1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 font-semibold"
              >
                {tipoCalendario === 'mes' ? 'Mes Siguiente' : 'Semana Siguiente'} →
              </button>
            </div>
          </div>

          {/* TITULARES DE DÍAS DE LA SEMANA */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
          </div>

          {/* VISTA A: MATRIZ POR MES */}
          {tipoCalendario === 'mes' && (
            <div className="grid grid-cols-7 gap-2">
              {diasMatrizMes.map((dia, idx) => {
                if (dia === null) {
                  return <div key={idx} className="h-28 bg-gray-50/50 rounded-xl"></div>;
                }

                const citasDelDia = citas.filter((c) => {
                  if (!c.fecha_hora_inicio) return false;
                  const dateCita = new Date(c.fecha_hora_inicio);
                  return (
                    dateCita.getDate() === dia &&
                    dateCita.getMonth() === mesActual &&
                    dateCita.getFullYear() === añoActual
                  );
                });

                return (
                  <div key={idx} className="h-28 border border-gray-100 rounded-xl p-2 bg-white flex flex-col justify-between overflow-hidden">
                    <span className="text-xs font-bold text-gray-700">{dia}</span>
                    <div className="space-y-1 overflow-y-auto max-h-20">
                      {citasDelDia.map((cita) => (
                        <div
                          key={cita.folio_cotizacion}
                          onClick={() => setCitaSeleccionadaModal(cita)}
                          className={`p-1.5 rounded-md text-[10px] cursor-pointer transition-transform hover:scale-95 ${
                            cita.estado === 'completada'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : cita.estado === 'programada'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <p className="font-bold truncate">{cita.cliente_nombre}</p>
                          <p className="text-[9px] opacity-80">
                            {new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA B: COLUMNAS POR SEMANA */}
          {tipoCalendario === 'semana' && (
            <div className="grid grid-cols-7 gap-2">
              {diasSemanaActual.map((fechaDia, idx) => {
                const esHoy = new Date().toDateString() === fechaDia.toDateString();

                const citasDelDia = citas.filter((c) => {
                  if (!c.fecha_hora_inicio) return false;
                  const dateCita = new Date(c.fecha_hora_inicio);
                  return dateCita.toDateString() === fechaDia.toDateString();
                });

                return (
                  <div
                    key={idx}
                    className={`min-h-[320px] border rounded-xl p-2.5 flex flex-col justify-between ${
                      esHoy ? 'bg-pink-50/20 border-pink-200' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="text-center pb-2 border-b border-gray-100">
                      <p className={`text-xs font-bold ${esHoy ? 'text-[#B82B71]' : 'text-gray-800'}`}>
                        {fechaDia.getDate()} {fechaDia.toLocaleString('es-MX', { month: 'short' })}
                      </p>
                    </div>

                    <div className="space-y-2 overflow-y-auto flex-1 mt-2 pr-0.5">
                      {citasDelDia.map((cita) => (
                        <div
                          key={cita.folio_cotizacion}
                          onClick={() => setCitaSeleccionadaModal(cita)}
                          className={`p-2 rounded-lg text-xs cursor-pointer transition-all hover:shadow-sm ${
                            cita.estado === 'completada'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : cita.estado === 'programada'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <p className="font-bold truncate">{cita.cliente_nombre} {cita.cliente_apellido}</p>
                          <p className="text-[10px] mt-0.5 font-medium">
                            🕒 {new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[10px] opacity-75 mt-0.5">
                            💅 {cita.manicurista_nombre || 'Sin asignar'}
                          </p>
                        </div>
                      ))}
                      {citasDelDia.length === 0 && (
                        <div className="text-center py-8 text-[11px] text-gray-300">
                          Sin citas
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* VISTA 2: LISTA DE CITAS */}
      {modoVista === 'historial' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <input
              type="text"
              placeholder="Buscar por folio, clienta o manicurista..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B82B71]"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF9F8] text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Folio Cotización</th>
                  <th className="px-6 py-3.5 font-medium">Clienta</th>
                  <th className="px-6 py-3.5 font-medium">Manicurista</th>
                  <th className="px-6 py-3.5 font-medium">Inicio</th>
                  <th className="px-6 py-3.5 font-medium">Monto</th>
                  <th className="px-6 py-3.5 font-medium">Estado</th>
                  <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {citasFiltradas.map((cita) => (
                  <tr key={cita.folio_cotizacion} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#B82B71]">{cita.folio_cotizacion}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{cita.cliente_nombre} {cita.cliente_apellido}</td>
                    <td className="px-6 py-4 text-xs text-gray-700">💅 {cita.manicurista_nombre || 'Sin asignar'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-800">{formatearFechaHora(cita.fecha_hora_inicio)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">${Number(cita.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        cita.estado === 'completada' ? 'bg-emerald-50 text-emerald-700' : cita.estado === 'programada' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {cita.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setCitaSeleccionadaModal(cita)}
                        className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
                      >
                        👁️ Ver / Modificar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: NUEVA CITA */}
      {modoVista === 'nueva' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Agendar Cita</h2>
          <form onSubmit={handleGuardarCita} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">1. Cotización Aceptada *</label>
              {cotizacionesAceptadas.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                  ⚠️ No hay cotizaciones aceptadas disponibles para agendar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  {cotizacionesAceptadas.map((cot) => (
                    <div
                      key={cot.folio}
                      onClick={() => setCotizacionSeleccionada(cot)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        cotizacionSeleccionada?.folio === cot.folio ? 'bg-pink-50 border-[#B82B71]' : 'bg-white border-gray-200'
                      }`}
                    >
                      <p className="font-mono font-bold text-[#B82B71] text-xs">{cot.folio}</p>
                      <p className="text-xs font-semibold text-gray-800">{cot.cliente_nombre} {cot.cliente_apellido}</p>
                      <p className="text-[11px] text-gray-500">⏱️ {cot.duracion_estimada_minutos} min | ${Number(cot.total).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cotizacionSeleccionada && (
              <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">2. Manicurista *</label>
                    <select
                      required
                      value={manicuristaId}
                      onChange={(e) => setManicuristaId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                    >
                      <option value="">-- Seleccionar --</option>
                      {manicuristas.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre} {m.apellido_paterno}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">3. Fecha *</label>
                    <input
                      type="date"
                      required
                      min={minDate}
                      max={maxDate}
                      value={fechaCita}
                      onChange={(e) => setFechaCita(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">4. Hora *</label>
                    <input
                      type="time"
                      required
                      value={horaCita}
                      onChange={(e) => setHoraCita(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  📅 Disponible a partir de mañana (<strong>{minDate}</strong>) hasta un máximo de 30 días (<strong>{maxDate}</strong>).
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={!cotizacionSeleccionada}
                className="px-5 py-2 bg-[#B82B71] hover:bg-[#9d2460] text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Confirmar Cita
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DETALLE / MODIFICACIÓN DE ESTADO DE CITA */}
      {citaSeleccionadaModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Detalle de la Cita</h3>
              <button onClick={() => setCitaSeleccionadaModal(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p><span className="text-gray-400">Folio:</span> <strong className="font-mono text-[#B82B71]">{citaSeleccionadaModal.folio_cotizacion}</strong></p>
              <p><span className="text-gray-400">Clienta:</span> <strong className="text-gray-800">{citaSeleccionadaModal.cliente_nombre} {citaSeleccionadaModal.cliente_apellido}</strong></p>
              <p><span className="text-gray-400">Manicurista:</span> <strong className="text-gray-800">{citaSeleccionadaModal.manicurista_nombre || 'Sin asignar'}</strong></p>
              <p><span className="text-gray-400">Inicio:</span> <strong className="text-gray-800">{formatearFechaHora(citaSeleccionadaModal.fecha_hora_inicio)}</strong></p>
              <p><span className="text-gray-400">Monto Total:</span> <strong className="text-[#B82B71]">${Number(citaSeleccionadaModal.total).toFixed(2)}</strong></p>
              <p>
                <span className="text-gray-400">Estado Actual:</span>{' '}
                <span className="capitalize font-bold text-gray-800">{citaSeleccionadaModal.estado}</span>
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Cambiar Estado:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleCambiarEstado(citaSeleccionadaModal.folio_cotizacion, 'programada')}
                  className="px-2 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100"
                >
                  Programada
                </button>
                <button
                  onClick={() => handleCambiarEstado(citaSeleccionadaModal.folio_cotizacion, 'completada')}
                  className="px-2 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100"
                >
                  Completada
                </button>
                <button
                  onClick={() => handleCambiarEstado(citaSeleccionadaModal.folio_cotizacion, 'cancelada')}
                  className="px-2 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100"
                >
                  Cancelada
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setCitaSeleccionadaModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Citas;
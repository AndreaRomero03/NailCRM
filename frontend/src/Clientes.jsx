import React, { useState, useEffect } from 'react';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de interfaz y filtrado
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);

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

  // Cargar clientes desde el backend
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

  // Abrir modal para crear clienta
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

  // Abrir modal para editar clienta
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

  // Guardar datos (POST/PUT)
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
      alert('Error de conexión con el servidor backend en http://localhost:5000. Verifica que el servidor Node.js continúe encendido.');
    }
  };

  // Filtro por nombre o teléfono
  const clientesFiltrados = clientes.filter((c) => {
    const nombreCompleto = `${c.nombre || ''} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}`.toLowerCase();
    const coincideBusqueda =
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      (c.telefono && c.telefono.includes(busqueda));

    const coincideTipo = filtroTipo === 'todas' || c.tipo === filtroTipo;
    return coincideBusqueda && coincideTipo;
  });

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className="p-8 space-y-6 font-sans">
      
      {/* CABECERA DE LA PANTALLA */}
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

      {/* TARJETAS KPI DE RESUMEN */}
      <div className="grid grid-cols-4 gap-4">
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
          <p className="text-sm text-gray-500 mb-1">Con Alergias Registradas</p>
          <p className="text-3xl font-bold text-rose-600">
            {clientes.filter((c) => c.alergia).length}
          </p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono (WhatsApp)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B82B71]"
          />
        </div>

        <div className="flex gap-2 text-sm">
          {[
            { label: 'Todas', value: 'todas' },
            { label: 'Nuevas', value: 'nueva' },
            { label: 'Recurrentes', value: 'recurrente' },
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

      {/* TABLA PRINCIPAL DE CLIENTAS */}
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
                <th className="px-6 py-3.5 font-medium">Alergias</th>
                <th className="px-6 py-3.5 font-medium">Contacto Emergencia</th>
                <th className="px-6 py-3.5 font-medium">Preferencias</th>
                <th className="px-6 py-3.5 font-medium">Observaciones</th>
                <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {clientesFiltrados.map((c) => (
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
                    {c.tipo === 'recurrente' ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                        Recurrente
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-[#FDF2F8] text-[#B82B71] border border-pink-200 rounded-full text-xs font-medium">
                        Nueva
                      </span>
                    )}
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
                  <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                    {c.preferencias || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                    {c.observaciones || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleAbrirEditar(c)}
                      className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-400">
                    No se encontraron clientas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CREAR / EDITAR CLIENTA */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* CABECERA FIJA */}
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

            {/* FORMULARIO DESPLAZABLE EN EL CENTRO */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
                
                {/* DATOS PERSONALES */}
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo Clienta</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                    >
                      <option value="nueva">Nueva</option>
                      <option value="recurrente">Recurrente</option>
                    </select>
                  </div>
                </div>

                {/* SECCIÓN BIOSEGURIDAD Y ALERGIAS */}
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

                {/* CONTACTO DE EMERGENCIA */}
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

                {/* PREFERENCIAS Y OBSERVACIONES */}
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

              {/* PIE DE PÁGINA FIJO */}
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
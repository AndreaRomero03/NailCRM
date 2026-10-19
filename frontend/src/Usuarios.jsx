import React, { useState, useEffect } from 'react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de interfaz y filtrado
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);

  // Formulario de usuario alineado al esquema oficial de public.usuarios
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    password: '',
    rol: 'manicurista',
    activo: true,
  });

  // Cargar lista de usuarios desde el backend
  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const res = await fetch('http://localhost:5000/api/usuarios');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${res.status}: ${res.statusText})`);
      }
      const data = await res.json();
      setUsuarios(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Abrir modal para crear un nuevo usuario
  const handleAbrirCrear = () => {
    setUsuarioEditar(null);
    setFormData({
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      password: '',
      rol: 'manicurista',
      activo: true,
    });
    setModalAbierto(true);
  };

  // Abrir modal para editar un usuario existente
  const handleAbrirEditar = (usr) => {
    setUsuarioEditar(usr);
    setFormData({
      nombre: usr.nombre || '',
      apellido_paterno: usr.apellido_paterno || '',
      apellido_materno: usr.apellido_materno || '',
      email: usr.email || '',
      password: '', // La contraseña siempre inicia vacía al editar
      rol: usr.rol || 'manicurista',
      activo: Boolean(usr.activo),
    });
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    // Limpieza inmediata de credenciales del estado
    setFormData({
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      password: '',
      rol: 'manicurista',
      activo: true,
    });
  };

  // Guardar datos de usuario (POST / PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const esEdicion = !!usuarioEditar;
    const url = esEdicion
      ? `http://localhost:5000/api/usuarios/${usuarioEditar.id}`
      : 'http://localhost:5000/api/usuarios';
    const method = esEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        handleCerrarModal();
        cargarUsuarios();
      } else {
        let mensajeError = 'No se pudo guardar el usuario.';
        try {
          const errData = await res.json();
          mensajeError = errData.error || mensajeError;
        } catch (_) {
          mensajeError = `Error del servidor (${res.status}: ${res.statusText})`;
        }
        alert(`Error: ${mensajeError}`);
      }
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      alert('Error de conexión con el servidor backend en http://localhost:5000.');
    } finally {
      // Garantizar la eliminación de email y password en memoria tras el proceso
      setFormData((prev) => ({ ...prev, email: '', password: '' }));
    }
  };

  // Cambiar estatus activo / inactivo
  const handleToggleEstado = async (usr) => {
    const nuevoEstado = !usr.activo;
    try {
      const res = await fetch(`http://localhost:5000/api/usuarios/${usr.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      if (res.ok) {
        cargarUsuarios();
      } else {
        alert('No se pudo cambiar el estado del usuario.');
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  // Filtrado de usuarios por nombre, correo o rol
  const usuariosFiltrados = usuarios.filter((u) => {
    const nombreCompleto = `${u.nombre || ''} ${u.apellido_paterno || ''} ${u.apellido_materno || ''}`.toLowerCase();
    const coincideBusqueda =
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(busqueda.toLowerCase())) ||
      (u.rol && u.rol.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && u.activo) ||
      (filtroEstado === 'inactivos' && !u.activo);

    return coincideBusqueda && coincideEstado;
  });

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-8 space-y-6 font-sans">
      
      {/* CABECERA DE PANTALLA */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Personal / Usuarios</h1>
          <p className="text-sm text-gray-500">Control de acceso, asignación de roles y estatus de colaboradores</p>
        </div>
        <button
          onClick={handleAbrirCrear}
          className="bg-[#B82B71] hover:bg-[#9d2460] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>+</span> Nuevo usuario
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
          <p className="text-sm text-gray-500 mb-1">Total Personal</p>
          <p className="text-3xl font-bold text-gray-900">{usuarios.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Administradoras</p>
          <p className="text-3xl font-bold text-[#B82B71]">
            {usuarios.filter((u) => u.rol === 'administradora').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Manicuristas</p>
          <p className="text-3xl font-bold text-purple-600">
            {usuarios.filter((u) => u.rol === 'manicurista').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Usuarios Activos</p>
          <p className="text-3xl font-bold text-emerald-600">
            {usuarios.filter((u) => u.activo).length}
          </p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre, correo electrónico o rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B82B71]"
          />
        </div>

        <div className="flex gap-2 text-sm">
          {[
            { label: 'Todos', value: 'todos' },
            { label: 'Activos', value: 'activos' },
            { label: 'Inactivos', value: 'inactivos' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFiltroEstado(btn.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === btn.value
                  ? 'bg-[#B82B71] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA PRINCIPAL DE USUARIOS */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-gray-500">Cargando directorio de personal...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF9F8] text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5 font-medium">Nombre completo</th>
                <th className="px-6 py-3.5 font-medium">Correo electrónico</th>
                <th className="px-6 py-3.5 font-medium">Rol</th>
                <th className="px-6 py-3.5 font-medium">Estado</th>
                <th className="px-6 py-3.5 font-medium">Fecha Registro</th>
                <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {u.nombre} {u.apellido_paterno} {u.apellido_materno}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                    {u.email || 'Sin registro'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      u.rol === 'administradora'
                        ? 'bg-pink-50 text-[#B82B71] border border-pink-200'
                        : u.rol === 'manicurista'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.activo ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-full text-xs font-medium">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {formatearFecha(u.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleEstado(u)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        u.activo
                          ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                          : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleAbrirEditar(u)}
                      className="text-xs px-3 py-1 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CREAR / EDITAR USUARIO CON SCROLL INTERNO Y CABECERA/PIE FIJOS */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* CABECERA FIJA */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {usuarioEditar ? 'Editar datos de usuario' : 'Registrar nuevo usuario'}
                </h3>
                <p className="text-xs text-gray-500">Credenciales de acceso y asignación de perfil</p>
              </div>
              <button 
                onClick={handleCerrarModal} 
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* FORMULARIO DESPLAZABLE */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" autoComplete="off">
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
                    placeholder="Ej. Andrea"
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
                      placeholder="Ej. Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido Materno</label>
                    <input
                      type="text"
                      value={formData.apellido_materno}
                      onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                      placeholder="Ej. Romero"
                    />
                  </div>
                </div>

                {/* CORREO Y CONTRASEÑA (SÓLO REGISTRO) */}
                {!usuarioEditar && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico (Acceso) *</label>
                      <input
                        type="email"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                        placeholder="usuario@ateneastudio.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña de acceso *</label>
                      <input
                        type="password"
                        required
                        minLength="6"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  </>
                )}

                {/* ROL Y ESTATUS */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Rol de Usuario *</label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                    >
                      <option value="administradora">Administradora</option>
                      <option value="manicurista">Manicurista</option>
                      <option value="recepcionista">Recepcionista</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Estado de la cuenta</label>
                    <select
                      value={formData.activo ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* PIE DE PÁGINA FIJO */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCerrarModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B82B71] hover:bg-[#9d2460] text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  {usuarioEditar ? 'Guardar cambios' : 'Registrar usuario'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Usuarios;
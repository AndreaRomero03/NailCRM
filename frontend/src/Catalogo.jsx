import React, { useState, useEffect } from 'react';

const Catalogo = () => {
  const [elementos, setElementos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Control de pestaña activa ('elementos' | 'categorias')
  const [pestanaActiva, setPestanaActiva] = useState('elementos');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCatAbierto, setModalCatAbierto] = useState(false);

  // Elementos a editar
  const [elementoEditar, setElementoEditar] = useState(null);
  const [categoriaEditar, setCategoriaEditar] = useState(null);

  // Formulario Elemento
  const [formData, setFormData] = useState({
    categoria_id: '',
    concepto: '',
    duracion_minutos: 30,
    precio: '',
    activo: true,
  });

  // Formulario Categoría
  const [formCatData, setFormCatData] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
  });

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resElem, resCat] = await Promise.all([
        fetch('http://localhost:5000/api/catalogo/elementos'),
        fetch('http://localhost:5000/api/catalogo/categorias'),
      ]);

      if (!resElem.ok) {
        const errElem = await resElem.json().catch(() => ({}));
        throw new Error(errElem.error || `Error al consultar elementos (${resElem.status})`);
      }

      if (!resCat.ok) {
        const errCat = await resCat.json().catch(() => ({}));
        throw new Error(errCat.error || `Error al consultar categorías (${resCat.status})`);
      }

      const dataElem = await resElem.json();
      const dataCat = await resCat.json();

      setElementos(dataElem);
      setCategorias(dataCat);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- MANEJO DE ELEMENTOS ---
  const handleAbrirCrearElemento = () => {
    setElementoEditar(null);
    setFormData({
      categoria_id: categorias.length > 0 ? categorias[0].id : '',
      concepto: '',
      duracion_minutos: 30,
      precio: '',
      activo: true,
    });
    setModalAbierto(true);
  };

  const handleAbrirEditarElemento = (elem) => {
    setElementoEditar(elem);
    setFormData({
      categoria_id: elem.categoria_id || '',
      concepto: elem.concepto || '',
      duracion_minutos: elem.duracion_minutos || 0,
      precio: elem.precio || '',
      activo: Boolean(elem.activo),
    });
    setModalAbierto(true);
  };

  const handleSubmitElemento = async (e) => {
    e.preventDefault();
    const esEdicion = !!elementoEditar;
    const url = esEdicion
      ? `http://localhost:5000/api/catalogo/elementos/${elementoEditar.id}`
      : 'http://localhost:5000/api/catalogo/elementos';
    const method = esEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalAbierto(false);
        cargarDatos();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error: ${errData.error || 'No se pudo guardar el elemento.'}`);
      }
    } catch (err) {
      console.error('Error al guardar elemento:', err);
      alert('Error de conexión con el servidor backend.');
    }
  };

  const handleToggleEstadoElemento = async (elem) => {
    try {
      const res = await fetch(`http://localhost:5000/api/catalogo/elementos/${elem.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !elem.activo }),
      });

      if (res.ok) {
        cargarDatos();
      }
    } catch (err) {
      console.error('Error al cambiar estado de elemento:', err);
    }
  };

  // --- MANEJO DE CATEGORÍAS ---
  const handleAbrirCrearCategoria = () => {
    setCategoriaEditar(null);
    setFormCatData({
      nombre: '',
      descripcion: '',
      activo: true,
    });
    setModalCatAbierto(true);
  };

  const handleAbrirEditarCategoria = (cat) => {
    setCategoriaEditar(cat);
    setFormCatData({
      nombre: cat.nombre || '',
      descripcion: cat.descripcion || '',
      activo: Boolean(cat.activo),
    });
    setModalCatAbierto(true);
  };

  const handleSubmitCategoria = async (e) => {
    e.preventDefault();
    const esEdicion = !!categoriaEditar;
    const url = esEdicion
      ? `http://localhost:5000/api/catalogo/categorias/${categoriaEditar.id}`
      : 'http://localhost:5000/api/catalogo/categorias';
    const method = esEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formCatData),
      });

      if (res.ok) {
        setModalCatAbierto(false);
        cargarDatos();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error: ${errData.error || 'No se pudo guardar la categoría.'}`);
      }
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      alert('Error de conexión al guardar la categoría.');
    }
  };

  const handleToggleEstadoCategoria = async (cat) => {
    try {
      const res = await fetch(`http://localhost:5000/api/catalogo/categorias/${cat.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !cat.activo }),
      });

      if (res.ok) {
        cargarDatos();
      }
    } catch (err) {
      console.error('Error al cambiar estado de categoría:', err);
    }
  };

  // Filtrado de listas
  const elementosFiltrados = elementos.filter((e) => {
    const coincideBusqueda = e.concepto.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria =
      categoriaFiltro === 'todas' || String(e.categoria_id) === String(categoriaFiltro);
    return coincideBusqueda && coincideCategoria;
  });

  const categoriasFiltradas = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 font-sans">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Elementos y Categorías</h1>
          <p className="text-sm text-gray-500">Gestión de técnicas, tarifas y organización del catálogo</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAbrirCrearCategoria}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + Nueva Categoría
          </button>
          <button
            onClick={handleAbrirCrearElemento}
            className="bg-[#B82B71] hover:bg-[#9d2460] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>+</span> Nuevo Elemento
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <strong>Error de conexión:</strong> {error}
        </div>
      )}

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Elementos</p>
          <p className="text-3xl font-bold text-gray-900">{elementos.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Categorías Registradas</p>
          <p className="text-3xl font-bold text-[#B82B71]">{categorias.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Categorías Activas</p>
          <p className="text-3xl font-bold text-emerald-600">
            {categorias.filter((c) => c.activo).length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Precio Promedio</p>
          <p className="text-3xl font-bold text-purple-600">
            ${elementos.length > 0
              ? (elementos.reduce((sum, e) => sum + Number(e.precio || 0), 0) / elementos.length).toFixed(2)
              : '0.00'}
          </p>
        </div>
      </div>

      {/* NAVEGACIÓN POR PESTAÑAS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        
        {/* Pestañas */}
        <div className="flex gap-2">
          <button
            onClick={() => setPestanaActiva('elementos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pestanaActiva === 'elementos'
                ? 'bg-[#B82B71] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Elementos ({elementos.length})
          </button>
          <button
            onClick={() => setPestanaActiva('categorias')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pestanaActiva === 'categorias'
                ? 'bg-[#B82B71] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Categorías ({categorias.length})
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 w-full md:w-auto flex-1 max-w-md">
          <input
            type="text"
            placeholder={pestanaActiva === 'elementos' ? 'Buscar elemento...' : 'Buscar categoría...'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B82B71]"
          />

          {pestanaActiva === 'elementos' && (
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B82B71] bg-white text-gray-700"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          )}
        </div>

      </div>

      {/* VISTA 1: TABLA DE ELEMENTOS */}
      {pestanaActiva === 'elementos' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando catálogo de elementos...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF9F8] text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Concepto / Elemento</th>
                  <th className="px-6 py-3.5 font-medium">Categoría</th>
                  <th className="px-6 py-3.5 font-medium">Duración estimada</th>
                  <th className="px-6 py-3.5 font-medium">Precio base</th>
                  <th className="px-6 py-3.5 font-medium">Estado</th>
                  <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {elementosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {item.concepto}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {item.categoria_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      ⏱️ {item.duracion_minutos} min
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      ${Number(item.precio).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {item.activo ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                          Disponible
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-full text-xs font-medium">
                          No disponible
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleEstadoElemento(item)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                          item.activo
                            ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {item.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleAbrirEditarElemento(item)}
                        className="text-xs px-3 py-1 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {elementosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      No se encontraron elementos en el catálogo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* VISTA 2: TABLA DE CATEGORÍAS */}
      {pestanaActiva === 'categorias' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando categorías...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF9F8] text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Categoría</th>
                  <th className="px-6 py-3.5 font-medium">Descripción</th>
                  <th className="px-6 py-3.5 font-medium">Elementos Asociados</th>
                  <th className="px-6 py-3.5 font-medium">Estado</th>
                  <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {categoriasFiltradas.map((cat) => {
                  const elementosEnCat = elementos.filter((e) => e.categoria_id === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {cat.nombre}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {cat.descripcion || 'Sin descripción'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                        {elementosEnCat} elemento(s)
                      </td>
                      <td className="px-6 py-4">
                        {cat.activo ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                            Activa
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-full text-xs font-medium">
                            Inactiva
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleEstadoCategoria(cat)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                            cat.activo
                              ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {cat.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleAbrirEditarCategoria(cat)}
                          className="text-xs px-3 py-1 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {categoriasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                      No se encontraron categorías registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL CREAR / EDITAR ELEMENTO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {elementoEditar ? 'Editar elemento' : 'Agregar nuevo elemento'}
                </h3>
                <p className="text-xs text-gray-500">Parámetros de tarifa y duración estimada</p>
              </div>
              <button 
                onClick={() => setModalAbierto(false)} 
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitElemento} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Concepto / Nombre del elemento *</label>
                  <input
                    type="text"
                    required
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                    placeholder="Ej. Uñas Esculturales, Gelish, etc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría *</label>
                  <select
                    required
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Duración (Minutos) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={formData.duracion_minutos}
                      onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Precio Base ($ MXN) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado de disponibilidad</label>
                  <select
                    value={formData.activo ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                  >
                    <option value="true">Disponible en catálogo</option>
                    <option value="false">No disponible</option>
                  </select>
                </div>

              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B82B71] hover:bg-[#9d2460] text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  {elementoEditar ? 'Guardar cambios' : 'Agregar elemento'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CATEGORÍA */}
      {modalCatAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {categoriaEditar ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
            </h3>
            <form onSubmit={handleSubmitCategoria} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre de la categoría *</label>
                <input
                  type="text"
                  required
                  value={formCatData.nombre}
                  onChange={(e) => setFormCatData({ ...formCatData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                  placeholder="Ej. Adicional, Elemento, Promoción, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  rows="2"
                  value={formCatData.descripcion}
                  onChange={(e) => setFormCatData({ ...formCatData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                  placeholder="Breve descripción técnica, forma de cobro (set, uña o pieza) o detalles de la categoría."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                <select
                  value={formCatData.activo ? 'true' : 'false'}
                  onChange={(e) => setFormCatData({ ...formCatData, activo: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B82B71]"
                >
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCatAbierto(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B82B71] text-white rounded-lg text-xs font-medium"
                >
                  {categoriaEditar ? 'Guardar Cambios' : 'Guardar Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Catalogo;
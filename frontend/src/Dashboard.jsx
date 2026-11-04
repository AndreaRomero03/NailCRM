import React, { useState, useEffect } from 'react';

const Dashboard = ({ setModuloActivo }) => {
  const [data, setData] = useState({
    kpis: { generadas: 0, aceptadas: 0, pendientes: 0, rechazadas: 0, tasaConversion: 0, citasAtendidas: 0, citasHoy: 0 },
    clientesMetricas: { nuevas: 0, pctNuevas: 0, recurrentes: 0, pctRecurrentes: 0 },
    topServicios: [],
    cotizacionesRecientes: []
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      const res = await fetch('http://localhost:5000/api/dashboard');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${res.status})`);
      }
      const result = await res.json();

      setData({
        kpis: {
          generadas: Number(result.kpis?.generadas) || 0,
          aceptadas: Number(result.kpis?.aceptadas) || 0,
          pendientes: Number(result.kpis?.pendientes) || 0,
          rechazadas: Number(result.kpis?.rechazadas) || 0,
          tasaConversion: Number(result.kpis?.tasaConversion) || 0,
          citasAtendidas: Number(result.kpis?.citasAtendidas) || 0,
          citasHoy: Number(result.kpis?.citasHoy) || 0,
        },
        clientesMetricas: {
          nuevas: Number(result.clientesMetricas?.nuevas) || 0,
          pctNuevas: Number(result.clientesMetricas?.pctNuevas) || 0,
          recurrentes: Number(result.clientesMetricas?.recurrentes) || 0,
          pctRecurrentes: Number(result.clientesMetricas?.pctRecurrentes) || 0,
        },
        topServicios: Array.isArray(result.topServicios) ? result.topServicios : [],
        cotizacionesRecientes: Array.isArray(result.cotizacionesRecientes) ? result.cotizacionesRecientes : []
      });
      setError(null);
    } catch (err) {
      console.error('Error al cargar Dashboard:', err);
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const formatearFechaVencimiento = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const fecha = new Date(isoStr);
      return `Vence ${fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`;
    } catch {
      return '-';
    }
  };

  // Función para exportar el reporte en formato CSV (.csv)
  const handleExportarReporte = () => {
    const filasCsv = [];

    // 1. Encabezados y valores de Métricas Generales (KPIs)
    filasCsv.push(['--- RESUMEN EJECUTIVO KPI ---']);
    filasCsv.push(['Metrica', 'Valor']);
    filasCsv.push(['Cotizaciones Generadas', data.kpis.generadas]);
    filasCsv.push(['Cotizaciones Aceptadas', data.kpis.aceptadas]);
    filasCsv.push(['Cotizaciones Pendientes', data.kpis.pendientes]);
    filasCsv.push(['Cotizaciones Rechazadas', data.kpis.rechazadas]);
    filasCsv.push(['Tasa de Conversion (%)', `${data.kpis.tasaConversion}%`]);
    filasCsv.push(['Citas Atendidas', data.kpis.citasAtendidas]);
    filasCsv.push(['Citas Programadas Hoy', data.kpis.citasHoy]);
    filasCsv.push([]);

    // 2. Métricas de Clientes
    filasCsv.push(['--- BASE DE CLIENTAS ---']);
    filasCsv.push(['Tipo', 'Cantidad', 'Porcentaje']);
    filasCsv.push(['Nuevas', data.clientesMetricas.nuevas, `${data.clientesMetricas.pctNuevas}%`]);
    filasCsv.push(['Recurrentes', data.clientesMetricas.recurrentes, `${data.clientesMetricas.pctRecurrentes}%`]);
    filasCsv.push([]);

    // 3. Servicios Más Solicitados
    filasCsv.push(['--- SERVICIOS MAS SOLICITADOS ---']);
    filasCsv.push(['Concepto / Servicio', 'Cantidad Solicitudes']);
    if (data.topServicios.length === 0) {
      filasCsv.push(['Sin registros de servicios', 0]);
    } else {
      data.topServicios.forEach((s) => {
        filasCsv.push([`"${s.concepto.replace(/"/g, '""')}"`, s.cantidad]);
      });
    }
    filasCsv.push([]);

    // 4. Cotizaciones Recientes
    filasCsv.push(['--- ULTIMAS COTIZACIONES RECIENTES ---']);
    filasCsv.push(['Folio', 'Cliente', 'Servicio Principal', 'Monto Total', 'Estado']);
    if (data.cotizacionesRecientes.length === 0) {
      filasCsv.push(['Sin cotizaciones registradas', '', '', 0, '']);
    } else {
      data.cotizacionesRecientes.forEach((c) => {
        const clienteNom = `"${(c.cliente_nombre || '')} ${(c.cliente_apellido || '')}"`.trim();
        const servNom = `"${(c.servicio_principal || 'Servicios Varios').replace(/"/g, '""')}"`;
        filasCsv.push([c.folio, clienteNom, servNom, `$${Number(c.total || 0).toFixed(2)}`, c.estado]);
      });
    }

    // Convertir el arreglo de filas a texto plano CSV (añadiendo UTF-8 BOM para tildes y caracteres especiales en Excel)
    const contenidoCsv = '\uFEFF' + filasCsv.map((e) => e.join(',')).join('\n');
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    
    // Disparar descarga directa del archivo .csv
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_AteneaStudio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6 font-sans bg-[#F9FAFB] min-h-screen">
      
      {/* CABECERA CON BOTÓN EXPORTAR REPORTE */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen administrativo y métricas clave del estudio</p>
        </div>
        <button
          onClick={handleExportarReporte}
          className="bg-[#B82B71] hover:bg-[#9d2460] text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-2"
        >
          <span>📊</span> Exportar reporte (.csv)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          <strong>Error en el Dashboard:</strong> {error}
        </div>
      )}

      {/* 1. TARJETAS KPI SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-400">Cotizaciones generadas</p>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-gray-900">{data.kpis.generadas}</p>
            <p className="text-[11px] font-medium text-emerald-600 mt-1">Registradas en sistema</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-400">Aceptadas</p>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-gray-900">{data.kpis.aceptadas}</p>
            <p className="text-[11px] font-medium text-amber-600 mt-1">{data.kpis.pendientes} pendientes</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-400">Rechazadas</p>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-gray-900">{data.kpis.rechazadas}</p>
            <p className="text-[11px] font-medium text-rose-500 mt-1">Cotizaciones no concretadas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-400">Tasa de conversión</p>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-gray-900">{data.kpis.tasaConversion}%</p>
            <p className="text-[11px] font-medium text-emerald-600 mt-1">Efectividad comercial</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-400">Citas atendidas</p>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-gray-900">{data.kpis.citasAtendidas}</p>
            <p className="text-[11px] font-medium text-[#B82B71] mt-1">{data.kpis.citasHoy} programadas hoy</p>
          </div>
        </div>
      </div>

      {/* 2. CLIENTES Y TOP SERVICIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">Clientes nuevos vs. recurrentes</h2>
            <p className="text-xs text-gray-400">Balance de la base de clientas registradas</p>
          </div>

          <div className="space-y-3">
            <div className="w-full h-3 bg-pink-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${data.clientesMetricas.pctNuevas}%` }}
                className="bg-[#B82B71] h-full transition-all duration-500"
              ></div>
              <div
                style={{ width: `${data.clientesMetricas.pctRecurrentes}%` }}
                className="bg-pink-300 h-full transition-all duration-500"
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#B82B71]">
                Nuevas: {data.clientesMetricas.nuevas} ({data.clientesMetricas.pctNuevas}%)
              </span>
              <span className="font-semibold text-gray-500">
                Recurrentes: {data.clientesMetricas.recurrentes} ({data.clientesMetricas.pctRecurrentes}%)
              </span>
            </div>
          </div>

          <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100 text-[11px] text-[#B82B71] font-medium">
            💡 Tip: Mantener a tus clientas recurrentes incrementa la frecuencia de visitas mensuales en el estudio.
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Servicios más solicitados</h2>
          
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {data.topServicios.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No hay registros suficientes de servicios.</p>
            ) : (
              data.topServicios.map((serv, index) => {
                const cantidadNum = Number(serv.cantidad) || 0;
                const porcentajeBarra = Math.min(cantidadNum * 15, 100);

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                      <span>{serv.concepto}</span>
                      <span className="font-mono text-gray-900">{cantidadNum}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#B82B71] h-full rounded-full transition-all duration-300"
                        style={{ width: `${porcentajeBarra}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. TABLA DE COTIZACIONES RECIENTES */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h2 className="text-sm font-bold text-gray-900">Cotizaciones recientes</h2>
          {setModuloActivo && (
            <button
              onClick={() => setModuloActivo('cotizaciones')}
              className="text-xs font-bold text-[#B82B71] hover:underline"
            >
              Ver todas →
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl">
          {cargando ? (
            <div className="p-8 text-center text-xs text-gray-400">Cargando cotizaciones recientes...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F8] text-gray-500 font-medium sticky top-0 border-b border-gray-100 bg-white z-10">
                <tr>
                  <th className="px-5 py-3 font-medium">Folio</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Servicio</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Vigencia</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {data.cotizacionesRecientes.map((cot) => (
                  <tr key={cot.folio} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#B82B71]">{cot.folio}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {cot.cliente_nombre} {cot.cliente_apellido}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 truncate max-w-[180px]">
                      {cot.servicio_principal || 'Servicios Varios'}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                      ${Number(cot.total || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {formatearFechaVencimiento(cot.fecha_vencimiento)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                        cot.estado === 'aceptada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        cot.estado === 'pendiente' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {cot.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.cotizacionesRecientes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400">
                      No hay cotizaciones recientes en la base de datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
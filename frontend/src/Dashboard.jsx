import React from 'react';

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans">
      
      {/* SIDEBAR (Menú Lateral) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#B82B71] text-white flex items-center justify-center font-bold">N</div>
            <span className="font-bold text-gray-900">Atenea Studio</span>
          </div>

          {/* Menú */}
          <div className="px-4 mt-4">
            <p className="text-xs font-semibold text-gray-400 mb-4 px-2">MÓDULOS</p>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-[#FDF2F8] text-[#B82B71] rounded-lg font-medium">
                <span className="w-2 h-2 rounded-full bg-[#B82B71]"></span> Dashboard
              </a>
              {['Clientes', 'Cotizaciones', 'Citas', 'Catálogo', 'Historial del cliente'].map((item) => (
                <a key={item} href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span> {item}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Usuario perfil */}
        <div className="p-4 border-t border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FDF2F8] text-[#B82B71] flex items-center justify-center font-bold text-sm">AS</div>
          <div>
            <p className="text-sm font-bold text-gray-900">Andrea Silva</p>
            <p className="text-xs text-gray-500">Administradora</p>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="px-8 py-6 bg-white border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Resumen administrativo · Octubre 2026</p>
          </div>
          <button className="bg-[#B82B71] hover:bg-[#9d2460] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Exportar reporte
          </button>
        </header>

        {/* Área de scroll del contenido */}
        <div className="flex-1 overflow-auto p-8 space-y-6">
          
          {/* Tarjetas de Indicadores (KPIs) */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Cotizaciones generadas</p>
              <p className="text-3xl font-bold text-gray-900">48</p>
              <p className="text-xs text-emerald-600 font-medium mt-2">+12% vs. septiembre</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Aceptadas</p>
              <p className="text-3xl font-bold text-gray-900">31</p>
              <p className="text-xs text-amber-600 font-medium mt-2">11 pendientes</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Rechazadas</p>
              <p className="text-3xl font-bold text-gray-900">6</p>
              <p className="text-xs text-red-500 font-medium mt-2">12.5% del total</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Tasa de conversión</p>
              <p className="text-3xl font-bold text-gray-900">64.6%</p>
              <p className="text-xs text-emerald-600 font-medium mt-2">+4.2 pts</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Citas atendidas</p>
              <p className="text-3xl font-bold text-gray-900">27</p>
              <p className="text-xs text-gray-500 font-medium mt-2">5 programadas hoy</p>
            </div>
          </div>

          {/* Gráficos y Estadísticas */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Gráfica de barras */}
            <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-base font-bold text-gray-900">Cotizaciones generadas vs. aceptadas</h2>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-200"></div> Generadas</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#B82B71]"></div> Aceptadas</span>
                </div>
              </div>
              {/* Simulación de gráfico con CSS */}
              <div className="flex items-end justify-between h-48 px-4">
                {/* Barras por mes */}
                {[
                  { mes: 'May', gen: 'h-24', acep: 'h-12' },
                  { mes: 'Jun', gen: 'h-28', acep: 'h-16' },
                  { mes: 'Jul', gen: 'h-24', acep: 'h-14' },
                  { mes: 'Ago', gen: 'h-36', acep: 'h-20' },
                  { mes: 'Sep', gen: 'h-32', acep: 'h-16' },
                  { mes: 'Oct', gen: 'h-40', acep: 'h-24' },
                ].map((data, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="flex items-end gap-1">
                      <div className={`w-8 bg-pink-200 rounded-t-sm ${data.gen}`}></div>
                      <div className={`w-8 bg-[#B82B71] rounded-t-sm ${data.acep}`}></div>
                    </div>
                    <span className="text-xs text-gray-500">{data.mes}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Barras de progreso */}
            <div className="col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-6">
              
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-4">Clientes nuevos vs. recurrentes</h2>
                <div className="w-full h-3 bg-pink-200 rounded-full overflow-hidden mb-2">
                  <div className="w-1/4 h-full bg-[#B82B71]"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span><span className="text-[#B82B71] font-medium">Nuevos</span> · 12 (25%)</span>
                  <span>Recurrentes · 35 (75%)</span>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900 mb-4">Servicio más solicitado</h2>
                <div className="space-y-4">
                  {[
                    { nombre: 'Gel semipermanente', val: 38, width: 'w-full' },
                    { nombre: 'Acrílico esculpido', val: 27, width: 'w-3/4' },
                    { nombre: 'Nail art / diseños', val: 22, width: 'w-[60%]' },
                    { nombre: 'Pedicure spa', val: 11, width: 'w-1/3' },
                  ].map((servicio, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{servicio.nombre}</span>
                        <span className="font-medium">{servicio.val}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`${servicio.width} h-full bg-[#c36594]`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Tabla de cotizaciones */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Cotizaciones recientes</h2>
              <a href="#" className="text-sm font-medium text-[#B82B71] hover:underline">Ver todas →</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF9F8] text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3 font-medium">Folio</th>
                    <th className="px-6 py-3 font-medium">Cliente</th>
                    <th className="px-6 py-3 font-medium">Servicio</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Vigencia</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {/* Fila 1 */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">COT-0048</td>
                    <td className="px-6 py-4">Camila Rojas</td>
                    <td className="px-6 py-4">Gel + nail art francés</td>
                    <td className="px-6 py-4">$680</td>
                    <td className="px-6 py-4">Vence 12 Oct</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-[#FEF3C7] text-amber-700 rounded-full text-xs font-medium">Pendiente</span>
                    </td>
                  </tr>
                  {/* Fila 2 */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">COT-0047</td>
                    <td className="px-6 py-4">Daniela Ortiz</td>
                    <td className="px-6 py-4">Acrílico esculpido + diseño</td>
                    <td className="px-6 py-4">$950</td>
                    <td className="px-6 py-4">Vence 10 Oct</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Aceptada</span>
                    </td>
                  </tr>
                  {/* Fila 3 */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">COT-0046</td>
                    <td className="px-6 py-4">Mariana Flores</td>
                    <td className="px-6 py-4">Gel semipermanente</td>
                    <td className="px-6 py-4">$420</td>
                    <td className="px-6 py-4 text-gray-400">Venció 03 Oct</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rechazada</span>
                    </td>
                  </tr>
                  {/* Fila 4 */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">COT-0045</td>
                    <td className="px-6 py-4">Paula Mendoza</td>
                    <td className="px-6 py-4">Baby boomer + pedrería</td>
                    <td className="px-6 py-4">$760</td>
                    <td className="px-6 py-4">Vence 09 Oct</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Aceptada</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default Dashboard;
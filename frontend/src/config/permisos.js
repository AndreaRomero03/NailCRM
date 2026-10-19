// Definición de todos los módulos del sistema
export const MODULOS_CRM = [
  { id: 'dashboard', nombre: 'Dashboard' },
  { id: 'clientes', nombre: 'Clientes' },
  { id: 'cotizaciones', nombre: 'Cotizaciones' },
  { id: 'citas', nombre: 'Citas' },
  { id: 'catalogo', nombre: 'Catálogo' },
  { id: 'historial', nombre: 'Historial del cliente' },
  { id: 'usuarios', nombre: 'Personal / Usuarios' },
];

// Matriz de permisos por rol
export const PERMISOS_POR_ROL = {
  administradora: ['dashboard', 'clientes', 'cotizaciones', 'citas', 'catalogo', 'historial', 'usuarios'],
  recepcion: ['dashboard', 'clientes', 'cotizaciones', 'citas', 'catalogo', 'historial'],
  manicurista: ['citas', 'catalogo', 'historial'],
};

// Función para obtener la vista por defecto de cada rol al iniciar sesión
export const getVistaInicial = (rol) => {
  const permitidos = PERMISOS_POR_ROL[rol] || ['citas'];
  return permitidos[0];
};
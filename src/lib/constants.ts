// CertiLink - Constants & Mock Data
// All UI text in Spanish for OTEC institutions

export const APP_NAME = "CertiLink";
export const APP_DESCRIPTION = "Plataforma de certificación digital para instituciones OTEC";

/** Logo principal en UI (`public/logo.png`). El favicon del sitio sigue siendo `public/favicon.svg` en `index.html`. */
export const LOGO_URL = "/logo.png";

// Navigation items
export const NAV_ITEMS = [
  { label: "Panel", path: "/dashboard", icon: "LayoutDashboard" },
  { label: "Estudiantes", path: "/estudiantes", icon: "Users" },
  { label: "Cursos", path: "/cursos", icon: "BookOpen" },
  { label: "Líneas académicas", path: "/lineas-academicas", icon: "GraduationCap" },
  { label: "Certificados", path: "/certificados", icon: "Award" },
] as const;

// Dashboard Stats
export const MOCK_STATS = {
  totalStudents: 1247,
  activeCourses: 18,
  certificatesIssued: 3892,
  verificationRate: 98.7,
};

// Mock Students
export const MOCK_STUDENTS = [
  { id: "EST-001", nombre: "María González", rut: "12.345.678-9", email: "maria.gonzalez@mail.cl", curso: "Gestión de Proyectos", estado: "activo" },
  { id: "EST-002", nombre: "Carlos Muñoz", rut: "13.456.789-0", email: "carlos.munoz@mail.cl", curso: "Contabilidad Básica", estado: "activo" },
  { id: "EST-003", nombre: "Ana Rodríguez", rut: "14.567.890-1", email: "ana.rodriguez@mail.cl", curso: "Marketing Digital", estado: "certificado" },
  { id: "EST-004", nombre: "Pedro Soto", rut: "15.678.901-2", email: "pedro.soto@mail.cl", curso: "Excel Avanzado", estado: "activo" },
  { id: "EST-005", nombre: "Francisca López", rut: "16.789.012-3", email: "francisca.lopez@mail.cl", curso: "Gestión de Proyectos", estado: "certificado" },
  { id: "EST-006", nombre: "Diego Hernández", rut: "17.890.123-4", email: "diego.hernandez@mail.cl", curso: "Seguridad Laboral", estado: "inactivo" },
  { id: "EST-007", nombre: "Valentina Castro", rut: "18.901.234-5", email: "valentina.castro@mail.cl", curso: "Contabilidad Básica", estado: "activo" },
  { id: "EST-008", nombre: "Sebastián Díaz", rut: "19.012.345-6", email: "sebastian.diaz@mail.cl", curso: "Marketing Digital", estado: "certificado" },
];

// Mock Courses
export const MOCK_COURSES = [
  { id: "CUR-001", nombre: "Gestión de Proyectos", codigo: "GP-2024", horas: 120, modalidad: "Presencial", inscritos: 42, estado: "activo" },
  { id: "CUR-002", nombre: "Contabilidad Básica", codigo: "CB-2024", horas: 80, modalidad: "Online", inscritos: 65, estado: "activo" },
  { id: "CUR-003", nombre: "Marketing Digital", codigo: "MD-2024", horas: 60, modalidad: "Híbrido", inscritos: 38, estado: "activo" },
  { id: "CUR-004", nombre: "Excel Avanzado", codigo: "EA-2024", horas: 40, modalidad: "Online", inscritos: 91, estado: "activo" },
  { id: "CUR-005", nombre: "Seguridad Laboral", codigo: "SL-2024", horas: 100, modalidad: "Presencial", inscritos: 27, estado: "finalizado" },
  { id: "CUR-006", nombre: "Liderazgo y Comunicación", codigo: "LC-2024", horas: 50, modalidad: "Online", inscritos: 54, estado: "activo" },
];

// Mock Certificates
export const MOCK_CERTIFICATES = [
  { id: "CERT-001", estudiante: "Ana Rodríguez", curso: "Marketing Digital", fecha: "2024-12-15", codigo: "CL-8A3F2B", estado: "emitido" },
  { id: "CERT-002", estudiante: "Francisca López", curso: "Gestión de Proyectos", fecha: "2024-12-10", codigo: "CL-7C4E1D", estado: "emitido" },
  { id: "CERT-003", estudiante: "Sebastián Díaz", curso: "Marketing Digital", fecha: "2024-12-08", codigo: "CL-5D9A3F", estado: "emitido" },
  { id: "CERT-004", estudiante: "María González", curso: "Gestión de Proyectos", fecha: "2024-11-28", codigo: "CL-2B6E8C", estado: "pendiente" },
  { id: "CERT-005", estudiante: "Carlos Muñoz", curso: "Contabilidad Básica", fecha: "2024-11-20", codigo: "CL-4F1D7A", estado: "emitido" },
];

// Mock Recent Activity
export const MOCK_ACTIVITY = [
  { tipo: "certificado", descripcion: "Certificado emitido para Ana Rodríguez", fecha: "Hace 2 horas", icono: "Award" },
  { tipo: "estudiante", descripcion: "Nuevo estudiante inscrito: Valentina Castro", fecha: "Hace 4 horas", icono: "UserPlus" },
  { tipo: "curso", descripcion: "Curso 'Excel Avanzado' actualizado", fecha: "Hace 6 horas", icono: "BookOpen" },
  { tipo: "verificacion", descripcion: "Certificado CL-7C4E1D verificado externamente", fecha: "Hace 8 horas", icono: "ShieldCheck" },
  { tipo: "certificado", descripcion: "Certificado emitido para Francisca López", fecha: "Hace 1 día", icono: "Award" },
];

// Status labels in Spanish
export const STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  certificado: "Certificado",
  emitido: "Emitido",
  pendiente: "Pendiente",
  finalizado: "Finalizado",
};

// Status variants
export const STATUS_VARIANT: Record<string, string> = {
  activo: "badge-success",
  certificado: "badge-primary",
  inactivo: "badge-warning",
  emitido: "badge-success",
  pendiente: "badge-warning",
  finalizado: "badge-primary",
};
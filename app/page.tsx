'use client';

import { useState, useEffect } from 'react';

// --- INTERFACES DE TIPADO DE TS ---
interface UserRecord {
  password?: string;
  role: string;
  name: string;
}

interface UserProfile {
  name: string;
  role: string;
  username: string;
}

interface AttendanceDays {
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
}

interface StudentData {
  id: string;
  name: string;
  grade: string;
  attendance: AttendanceDays;
}

// --- CURSOS ASIGNADOS POR DOCENTE (MAPEO DINÁMICO COMPLETO) ---
const TEACHER_COURSES: Record<string, string[]> = {
  teacher_math: [
    '8vo EGB - Paralelo A',
    '8vo EGB - Paralelo B',
    '8vo EGB - Paralelo C',
    '9no EGB - Paralelo A',
    '10mo EGB - Paralelo B',
  ],
  teacher_fis: [
    '10mo EGB - Paralelo C',
    '1ro BGU - Paralelo A',
    '1ro BGU - Paralelo B',
    '2do BGU - Paralelo B',
  ],
  default: [
    '8vo EGB - Paralelo A', '8vo EGB - Paralelo B', '8vo EGB - Paralelo C',
    '9no EGB - Paralelo A', '9no EGB - Paralelo B', '9no EGB - Paralelo C',
    '10mo EGB - Paralelo A', '10mo EGB - Paralelo B', '10mo EGB - Paralelo C',
    '1ro BGU - Paralelo A', '1ro BGU - Paralelo B', '1ro BGU - Paralelo C',
    '2do BGU - Paralelo A', '2do BGU - Paralelo B', '2do BGU - Paralelo C',
    '3ro BGU - Paralelo A', '3ro BGU - Paralelo B', '3ro BGU - Paralelo C',
  ],
};

// --- BASE DE DATOS DE USUARIOS ---
const USER_DATABASE: Record<string, UserRecord> = {
  teacher_math: { password: 'math2026', role: 'Docente de Matemáticas', name: 'Hugo Peña Ortiz' },
  teacher_edf: { password: 'edf2026', role: 'Docente de Educación Física', name: 'Miguel Cárdenas Torres' },
  teacher_ing: { password: 'ing2026', role: 'Docente de Inglés', name: 'María Lopez Paredes' },
  teacher_fis: { password: 'fis2026', role: 'Docente de Física', name: 'Diego Castro Romero' },
  teacher_bio: { password: 'bio2026', role: 'Docente de Biología', name: 'Gabriela Salazar Benitez' },
  teacher_fil: { password: 'fil2026', role: 'Docente de Filosofía', name: 'Ricardo Mendoza Castillo' },
  teacher_his: { password: 'his2026', role: 'Docente de Historia', name: 'Pedro Martínez Suárez' },
  teacher_qui: { password: 'qui2026', role: 'Docente de Química', name: 'Carolina Zambrano Pérez' },
  teacher_art: { password: 'art2026', role: 'Docente de Educación Cultural y Artística', name: 'Gabriela Guamote Flores' },
  teacher_emp: { password: 'emp2026', role: 'Docente de Emprendimiento y Gestión', name: 'Sebastián Herrera Vega' },
  teacher_len: { password: 'len2026', role: 'Docente de Lengua y Literatura', name: 'María Cevallos Paredes' },
  student001:  { password: '0012026', role: 'Estudiante_001', name: 'Carlos Vargas' },
  rectora_user: { password: 'rectora2026', role: 'Rectora', name: 'Msc. Rectora Institucional' },
  vicerrectora_user: { password: 'vice2026', role: 'Vicerrectora', name: 'Msc. Vicerrectora Académica' },
  secretaria_user: { password: 'secre2026', role: 'Secretaría', name: 'Secretaría General' },
};

const TEACHERS = Object.entries(USER_DATABASE)
  .filter(([key]) => key.startsWith('teacher_'))
  .map(([id, data]) => ({ id, name: `${data.name} (${data.role})` }));

// --- BASE DE DATOS DE ESTUDIANTES EXPANDIDA ---
const INITIAL_STUDENTS_BY_COURSE: Record<string, StudentData[]> = {
  '8vo EGB - Paralelo A': [
    { id: '8A-001', name: 'Ariel Santillán Vega', grade: '8.8', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '8A-002', name: 'Camila Esperanza Rios', grade: '9.2', attendance: { lunes: true, martes: true, miercoles: true, jueves: false, viernes: true } },
    { id: '8A-003', name: 'Dylan Javier Mendieta', grade: '7.0', attendance: { lunes: true, martes: false, miercoles: true, jueves: true, viernes: false } },
  ],
  '8vo EGB - Paralelo B': [
    { id: '8B-001', name: 'Bruno Alejandro Díaz', grade: '8.1', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '8B-002', name: 'Elena Sofía Cisneros', grade: '6.5', attendance: { lunes: false, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '8B-003', name: 'Ignacio Javier Paredes', grade: '9.4', attendance: { lunes: true, martes: true, miercoles: false, jueves: true, viernes: true } },
  ],
  '8vo EGB - Paralelo C': [
    { id: '8C-001', name: 'Mateo Sebastián Lasso', grade: '7.4', attendance: { lunes: true, martes: true, miercoles: false, jueves: true, viernes: true } },
    { id: '8C-002', name: 'Valeria Nicole Gomez', grade: '8.9', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '8C-003', name: 'Isaac Daniel Altamirano', grade: '8.0', attendance: { lunes: true, martes: true, miercoles: true, jueves: false, viernes: true } },
  ],
  '9no EGB - Paralelo A': [
    { id: '9A-001', name: 'Alan Josué Barahona', grade: '8.5', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '9A-002', name: 'Bianca Estefanía Loza', grade: '9.0', attendance: { lunes: true, martes: false, miercoles: true, jueves: true, viernes: true } },
    { id: '9A-003', name: 'Carlos Andrés Morán', grade: '6.9', attendance: { lunes: true, martes: true, miercoles: true, jueves: false, viernes: false } },
  ],
  '9no EGB - Paralelo B': [
    { id: '9B-001', name: 'Daniela Belén Proaño', grade: '7.8', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '9B-002', name: 'Emilio Rafael Andrade', grade: '8.3', attendance: { lunes: true, martes: true, miercoles: false, jueves: true, viernes: true } },
    { id: '9B-003', name: 'Fiorella María Solís', grade: '9.6', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
  ],
  '9no EGB - Paralelo C': [
    { id: '9C-001', name: 'Gonzalo Xavier Ortega', grade: '7.2', attendance: { lunes: true, martes: false, miercoles: true, jueves: true, viernes: true } },
    { id: '9C-002', name: 'Hanna Valentina Vaca', grade: '8.7', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: false } },
    { id: '9C-003', name: 'Ian Stefano Burbano', grade: '9.1', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
  ],
  '10mo EGB - Paralelo A': [
    { id: '10A-001', name: 'Lucas Gabriel Mendoza', grade: '9.5', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '10A-002', name: 'Doménica Paz Miño', grade: '8.1', attendance: { lunes: true, martes: false, miercoles: true, jueves: true, viernes: true } },
    { id: '10A-003', name: 'Joaquín Andrés Flores', grade: '7.6', attendance: { lunes: true, martes: true, miercoles: true, jueves: false, viernes: true } },
  ],
  '10mo EGB - Paralelo B': [
    { id: '10B-001', name: 'Santiago Esteban Cruz', grade: '8.6', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: false } },
    { id: '10B-002', name: 'Paula Andrea Villamar', grade: '9.0', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '10B-003', name: 'Kevin Alexander Pinto', grade: '6.2', attendance: { lunes: false, martes: false, miercoles: true, jueves: true, viernes: true } },
  ],
  '10mo EGB - Paralelo C': [
    { id: '10C-001', name: 'Melany Nicole Grijalva', grade: '8.9', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '10C-002', name: 'Néstor Fabian Aguirre', grade: '7.3', attendance: { lunes: true, martes: true, miercoles: false, jueves: true, viernes: true } },
    { id: '10C-003', name: 'Olga María Constante', grade: '9.8', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
  ],
  '1ro BGU - Paralelo A': [
    { id: '1A-001', name: 'Mateo Alejandro Benavides', grade: '7.9', attendance: { lunes: true, martes: true, miercoles: false, jueves: true, viernes: true } },
    { id: '1A-002', name: 'Sofia Valentina Morales', grade: '8.5', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '1A-003', name: 'Gabriel Esteban Cárdenas', grade: '9.0', attendance: { lunes: true, martes: true, miercoles: true, jueves: false, viernes: true } },
  ],
  '1ro BGU - Paralelo B': [
    { id: '1B-001', name: 'Isabella Doménica Paredes', grade: '8.2', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '1B-002', name: 'Joaquín Andrés Salazar', grade: '6.8', attendance: { lunes: true, martes: false, miercoles: false, jueves: true, viernes: true } },
    { id: '1B-003', name: 'Pamela Alejandra Tello', grade: '7.5', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: false } },
  ],
  '1ro BGU - Paralelo C': [
    { id: '1C-001', name: 'Daniel Fernando Ortíz', grade: '7.5', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: false } },
    { id: '1C-002', name: 'Rebeca Estefanía Lara', grade: '8.8', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '1C-003', name: 'Samuel Isaac Guano', grade: '9.1', attendance: { lunes: false, martes: true, miercoles: true, jueves: true, viernes: true } },
  ],
  '2do BGU - Paralelo A': [
    { id: '2A-001', name: 'Sebastián Marcelo Torres', grade: '9.1', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '2A-002', name: 'Tatiana Gisella Mora', grade: '8.0', attendance: { lunes: true, martes: true, miercoles: false, jueves: true, viernes: true } },
    { id: '2A-003', name: 'Ulises Ubaldo Donoso', grade: '6.7', attendance: { lunes: true, martes: false, miercoles: true, jueves: false, viernes: true } },
  ],
  '2do BGU - Paralelo B': [
    { id: '2B-001', name: 'Nicolás Javier Guerrero', grade: '6.5', attendance: { lunes: true, martes: false, miercoles: true, jueves: true, viernes: true } },
    { id: '2B-002', name: 'Mónica Ana Gomez', grade: '8.9', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '2B-003', name: 'Valerie Dayana Cobo', grade: '7.9', attendance: { lunes: true, martes: true, miercoles: true, jueves: false, viernes: false } },
  ],
  '2do BGU - Paralelo C': [
    { id: '2C-001', name: 'David Alejandro Moncayo', grade: '7.8', attendance: { lunes: true, martes: true, miercoles: true, jueves: false, viernes: true } },
    { id: '2C-002', name: 'William Roberto Fierro', grade: '8.4', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '2C-003', name: 'Ximena Clarisa Rubio', grade: '9.3', attendance: { lunes: false, martes: true, miercoles: true, jueves: true, viernes: true } },
  ],
  '3ro BGU - Paralelo A': [
    { id: '3A-001', name: 'Julian Eduardo Zambrano', grade: '5.9', attendance: { lunes: true, martes: false, miercoles: true, jueves: true, viernes: true } },
    { id: '3A-002', name: 'Yadira Paulina Terán', grade: '8.6', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '3A-003', name: 'Zacarias Josué Vera', grade: '7.2', attendance: { lunes: true, martes: true, miercoles: false, jueves: true, viernes: false } },
  ],
  '3ro BGU - Paralelo B': [
    { id: '3B-001', name: 'Andrea Carolina Mendoza', grade: '8.7', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '3B-002', name: 'Christian David Palacios', grade: '6.9', attendance: { lunes: true, martes: false, miercoles: true, jueves: true, viernes: true } },
    { id: '3B-003', name: 'Diana Elizabeth Medina', grade: '9.5', attendance: { lunes: true, martes: true, miercoles: true, jueves: false, viernes: true } },
  ],
  '3ro BGU - Paralelo C': [
    { id: '3C-001', name: 'Valeria Nicole Silva', grade: '9.2', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true } },
    { id: '3C-002', name: 'Erick Francisco Viteri', grade: '8.1', attendance: { lunes: true, martes: true, miercoles: false, jueves: true, viernes: true } },
    { id: '3C-003', name: 'Génesis Viviana Coello', grade: '7.4', attendance: { lunes: false, martes: true, miercoles: true, jueves: true, viernes: false } },
  ],
};

export default function CombinedAppSpace() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dashboardView, setDashboardView] = useState<'main' | 'matrix'>('main');

  // --- ESTADOS DE DATOS ---
  const [selectedTeacher, setSelectedTeacher] = useState<string>(TEACHERS[0]?.id || '');
  const availableCourses = TEACHER_COURSES[selectedTeacher] || TEACHER_COURSES.default;
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [studentsByCourse, setStudentsByCourse] = useState<Record<string, StudentData[]>>(INITIAL_STUDENTS_BY_COURSE);
  
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Asegurar que al cambiar de docente se asigne un curso válido de su lista
  useEffect(() => {
    const courses = TEACHER_COURSES[selectedTeacher] || TEACHER_COURSES.default;
    if (courses.length > 0) {
      setSelectedCourse(courses[0]);
    }
  }, [selectedTeacher]);

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacher(teacherId);
  };

  const currentCourseStudents = studentsByCourse[selectedCourse] || [];

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const targetUser = username.trim().toLowerCase();
    const userRecord = USER_DATABASE[targetUser];

    if (userRecord && userRecord.password === password) {
      setUserProfile({
        username: targetUser,
        name: userRecord.name,
        role: userRecord.role,
      });

      handleTeacherChange(targetUser);
      setIsAuthenticated(true);
      setDashboardView('main');
    } else {
      setError('Nombre de usuario o contraseña incorrectos.');
    }
  };

  // --- MANEJADORES DE ACTUALIZACIÓN CON CORRECCIÓN DE NOTA ---
  function handleStudentUpdate<K extends keyof StudentData>(id: string, key: K, value: StudentData[K]) {
    let finalValue = value;

    // Si actualizamos la calificación, sanitizamos la coma por punto
    if (key === 'grade' && typeof value === 'string') {
      finalValue = value.replace(',', '.') as StudentData[K];
    }

    setStudentsByCourse(prev => ({
      ...prev,
      [selectedCourse]: (prev[selectedCourse] || []).map(s =>
        s.id === id ? { ...s, [key]: finalValue } : s
      ),
    }));
  }

  const handleAttendanceChange = (id: string, day: keyof AttendanceDays, checked: boolean) => {
    setStudentsByCourse(prev => ({
      ...prev,
      [selectedCourse]: (prev[selectedCourse] || []).map(s =>
        s.id === id ? { ...s, attendance: { ...s.attendance, [day]: checked } } : s
      ),
    }));
  };

  // --- CONEXIÓN SÍNCRONA CON EL BACKEND FASTAPI ---
  const saveCourseData = async () => {
    setIsSaving(true);
    setError('');
    
    try {
      // Mapeo asegurando formato float antes de la transmisión a FastAPI
      const formattedStudents = currentCourseStudents.map(student => ({
        ...student,
        grade: parseFloat(student.grade.replace(',', '.')) || 0
      }));

      const payload = {
        course_id: selectedCourse,
        teacher_username: userProfile?.username || selectedTeacher,
        students: formattedStudents
      };

      console.log("[LOG] Enviando datos estructurados a FastAPI...", payload);

      const response = await fetch('http://127.0.0.1:8000/api/v1/courses/update-grades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("[LOG] Respuesta exitosa del backend:", responseData);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

    } catch (err: any) {
      console.error("[ERROR] Fallo en la sincronización:", err);
      alert(`No se pudo guardar en el servidor. Asegúrate de que FastAPI esté corriendo.\nDetalle: ${err.message}`);
    }
    setIsSaving(false);
  };

  // --- INTERFAZ DE LOGIN ---
  if (!isAuthenticated) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-950 font-sans p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-400">Sistema CTS</h1>
            <p className="text-xs text-slate-400 mt-2">Plataforma Integrada de Control Académico</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-rose-400 text-xs text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: teacher_math, teacher_fis"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-lg"
          >
            Iniciar Sesión
          </button>
        </form>
      </main>
    );
  }

  // --- INTERFAZ DE DASHBOARD ---
  return (
    <main className="p-8 bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-between font-sans">
      <div>
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 tracking-tight">Sistema CTS</h1>
            <p className="mt-1 text-slate-400 text-sm">Sistema de Operaciones y Control Institucional Homologado</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Workspace Activo</span>
              <span className="font-bold text-slate-200">{userProfile?.name}</span>
              <span className="text-blue-400 text-xs block font-mono">Rol: {userProfile?.role}</span>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-slate-900 hover:bg-rose-900/40 border border-slate-800 hover:border-rose-800 text-xs text-slate-300 hover:text-rose-300 p-3 rounded-lg transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Grid de Contexto de Curso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jurisdicción Académica</h3>
              <p className="text-xl font-bold mt-2 text-blue-400 font-mono">Filtro General por Aula</p>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Seleccionar Curso de Trabajo:</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  {availableCourses.map(course => <option key={course} value={course}>{course}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado de Datos del Aula</h3>
              <div className="text-lg font-medium mt-2 text-slate-200">
                Alumnos en {selectedCourse || '... '}: <span className="text-emerald-400 font-bold">{currentCourseStudents.length} Registrados</span>
              </div>
            </div>
            <button
              onClick={() => setDashboardView(dashboardView === 'matrix' ? 'main' : 'matrix')}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors"
            >
              {dashboardView === 'matrix' ? '🗂 Ir a Panel Principal' : '📝 Desplegar Consola Operativa'}
            </button>
          </div>
        </div>

        {/* SECCIÓN OPERATIVA MATRIX */}
        {dashboardView === 'matrix' && (
          <div className="mt-8 p-6 bg-slate-900/30 border border-slate-800 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-800/60">
              <div>
                <h2 className="text-xl font-bold text-slate-200">{selectedCourse}</h2>
                <p className="text-xs text-slate-400">Control local de calificaciones y asistencia.</p>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                    ¡Sincronizado con FastAPI con éxito!
                  </span>
                )}
                <button
                  onClick={saveCourseData}
                  disabled={isSaving}
                  className={`${
                    isSaving ? 'bg-emerald-800 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                  } text-white text-sm font-semibold py-2 px-5 rounded-lg transition-colors shadow-lg`}
                >
                  {isSaving ? '⏳ Sincronizando...' : '💾 Confirmar Cambios'}
                </button>
              </div>
            </div>

            {/* TABLA DE CONTROL */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-3 w-[15%]">Código</th>
                    <th className="p-3 w-[35%]">Estudiante</th>
                    <th className="p-3 w-[20%] text-center">Calificación (1-10)</th>
                    <th className="p-3 w-[30%] text-center">Asistencia (Lun - Vie)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {currentCourseStudents.length > 0 ? (
                    currentCourseStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="p-3 font-mono text-slate-500">{student.id}</td>
                        <td className="p-3 font-medium text-slate-200">{student.name}</td>
                        <td className="p-3 text-center">
                          <input
                            type="text" 
                            inputMode="decimal"
                            value={student.grade}
                            onChange={(e) => handleStudentUpdate(student.id, 'grade', e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-blue-400 font-bold focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center items-center gap-3 font-mono text-[10px]">
                            {(Object.keys(student.attendance) as Array<keyof AttendanceDays>).map((day) => (
                              <label key={day} className="flex flex-col items-center gap-1 cursor-pointer">
                                <span className="text-[9px] text-slate-500 uppercase">{day.slice(0, 3)}</span>
                                <input
                                  type="checkbox"
                                  checked={student.attendance[day]}
                                  onChange={(e) => handleAttendanceChange(student.id, day, e.target.checked)}
                                  className="rounded border-slate-800 bg-slate-900 text-emerald-500 w-3.5 h-3.5"
                                />
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">
                        No hay estudiantes registrados para este curso.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
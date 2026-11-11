'use client';

import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN BASE DE API BACKEND ---
const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:8000`;
};

// --- TIPOS E INTERFACES DE TS ---
export type UserRole = 'DOCENTE' | 'DECE' | 'VICERRECTORADO' | 'RECTORADO';

interface UserRecord {
  password?: string;
  role: string;
  name: string;
  subject?: string;
  cedula?: string;
}

interface UserProfile {
  name: string;
  role: string;
  username: string;
  subject: string;
  cedula?: string;
}

interface AttendanceDays {
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  [key: string]: boolean;
}

interface StudentData {
  id: string;
  name: string;
  grade: string | number;
  attendance: AttendanceDays;
}

interface Calificacion {
  id: number | string;
  course_id: string;
  student_id: string;
  grade: number;
  updated_at: string;
}

interface AsistenciaRecord {
  id: number | string;
  course_id: string;
  student_id: string;
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  updated_at: string;
}

interface Comunicacion {
  id: number;
  codigo_expediente: string;
  materia: string;
  curso: string;
  emisor_rol: string;
  destino: string;
  comunicado: string;
  created_at: string;
}

const DAYS_OF_WEEK: (keyof AttendanceDays)[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

const TEACHER_COURSES: Record<string, string[]> = {
  default: [
    '8vo EGB - Paralelo A', '8vo EGB - Paralelo B', '8vo EGB - Paralelo C',
    '9no EGB - Paralelo A', '9no EGB - Paralelo B', '9no EGB - Paralelo C',
    '10mo EGB - Paralelo A', '10mo EGB - Paralelo B', '10mo EGB - Paralelo C',
    '1ro BGU - Paralelo A', '1ro BGU - Paralelo B', '1ro BGU - Paralelo C',
    '2do BGU - Paralelo A', '2do BGU - Paralelo B', '2do BGU - Paralelo C',
    '3ro BGU - Paralelo A', '3ro BGU - Paralelo B', '3ro BGU - Paralelo C',
  ],
};

const USER_DATABASE: Record<string, UserRecord> = {
  teacher_math: { password: 'math2026', role: 'Docente de Matemáticas', name: 'Hugo Peña Ortiz', subject: 'Matemáticas' },
  teacher_edf: { password: 'edf2026', role: 'Docente de Educación Física', name: 'Miguel Cárdenas Torres', subject: 'Educación Física' },
  teacher_ing: { password: 'ing2026', role: 'Docente de Inglés', name: 'María Lopez Paredes', subject: 'Inglés' },
  teacher_fis: { password: 'fis2026', role: 'Docente de Física', name: 'Diego Castro Romero', subject: 'Física' },
  teacher_bio: { password: 'bio2026', role: 'Docente de Biología', name: 'Gabriela Salazar Benitez', subject: 'Biología' },
  teacher_fil: { password: 'fil2026', role: 'Docente de Filosofía', name: 'Ricardo Mendoza Castillo', subject: 'Filosofía' },
  teacher_his: { password: 'his2026', role: 'Docente de Historia', name: 'Pedro Martínez Suárez', subject: 'Historia' },
  teacher_qui: { password: 'qui2026', role: 'Docente de Química', name: 'Carolina Zambrano Pérez', subject: 'Química' },
  teacher_art: { password: 'art2026', role: 'Docente de Educación Cultural y Artística', name: 'Gabriela Guamote Flores', subject: 'Arte' },
  teacher_emp: { password: 'emp2026', role: 'Docente de Emprendimiento y Gestión', name: 'Sebastián Herrera Vega', subject: 'Emprendimiento' },
  teacher_len: { password: 'len2026', role: 'Docente de Lengua y Literatura', name: 'María Cevallos Paredes', subject: 'Lengua' },
  student001:  { password: '0012026', role: 'Estudiante_001', name: 'Carlos Vargas', subject: 'General' },
  rectora_user: { password: 'rectora2026', role: 'Rectora', name: 'Msc. Rectora Institucional', subject: 'Dirección' },
  vicerrectora_user: { password: 'vice2026', role: 'Vicerrectora', name: 'Msc. Vicerrectora Académica', subject: 'Vicerrectorado' },
  secretaria_user: { password: 'secre2026', role: 'Secretaría', name: 'Secretaría General', subject: 'Secretaría' },
  dece_user: { password: 'dece2026', role: 'DECE', name: 'Psic. DECE Institucional', subject: 'DECE' },
};

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
    { id: '10B-001', name: 'Santiago Esteban Cruz', grade: '5.9', attendance: { lunes: true, martes: true, miercoles: true, jueves: true, viernes: false } },
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

const getNormalizedRole = (roleStr?: string): UserRole => {
  if (!roleStr) return 'DOCENTE';
  const r = roleStr.toUpperCase();
  if (r.includes('RECTOR') && !r.includes('VICE')) return 'RECTORADO';
  if (r.includes('VICE')) return 'VICERRECTORADO';
  if (r.includes('DECE')) return 'DECE';
  return 'DOCENTE';
};

const downloadCSVFile = (filename: string, content: string) => {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};

// --- MÓDULO UNIFICADO DE COMUNICACIONES Y SINCRONIZACIÓN ---
function ModuloDespachoDECE({ 
  cursoActual, 
  materiaActual, 
  emisorRol = "Docente",
  inboxDestino = "DECE"
}: { 
  cursoActual: string; 
  materiaActual: string; 
  emisorRol?: string;
  inboxDestino?: string;
}) {
  const [comunicado, setComunicado] = useState('');
  const [destino, setDestino] = useState('DECE');
  const [expediente, setExpediente] = useState('');
  const [historial, setHistorial] = useState<Comunicacion[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarHistorial = async () => {
    const API_URL = getApiUrl();
    try {
      const targetQuery = inboxDestino;
      const res = await fetch(`${API_URL}/comunicaciones/${encodeURIComponent(targetQuery)}`);
      
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch (err) {
      console.error("Error cargando sincronizaciones:", err);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [inboxDestino]);

  const enviarComunicado = async () => {
    if (!comunicado.trim()) return;
    setLoading(true);

    try {
      const API_URL = getApiUrl();
      const payload = {
        codigo_expediente: expediente || "Sin Expediente Asignado",
        materia: materiaActual,
        curso: cursoActual,
        emisor_rol: emisorRol,
        emisor_id: `${emisorRol}-001`,
        comunicado: comunicado,
        destino: destino,
      };

      const res = await fetch(`${API_URL}/api/comunicaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setComunicado('');
        setExpediente('');
        cargarHistorial();
      } else {
        alert("Error al guardar comunicado en PostgreSQL");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 mt-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-400">
          Módulo Institucional {emisorRol} ({materiaActual})
        </h2>
        <div className="text-xs text-slate-400">
          Buzón activo: <span className="text-white font-bold">{inboxDestino}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Código de Caso / Expediente (Opcional)
          </label>
          <input
            type="text"
            placeholder="-- Sin Expediente Asignado (Reporte General) --"
            value={expediente}
            onChange={(e) => setExpediente(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 mb-4"
          />

          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Destino del Comunicado
          </label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 mb-4"
          >
            <option value="DECE">DECE</option>
            <option value="VICERRECTORADO">VICERRECTORADO</option>
            <option value="RECTORADO">RECTORADO</option>
            <option value="DOCENTES">DOCENTES DE AULA</option>
          </select>

          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Observaciones o Comunicado Oficial
          </label>
          <textarea
            rows={4}
            value={comunicado}
            onChange={(e) => setComunicado(e.target.value)}
            placeholder="Escribe un informe institucional, alerta o resolución..."
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 mb-3 resize-none"
          />
          <button
            onClick={enviarComunicado}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Sincronizando...' : 'Enviar y Sincronizar'}
          </button>
        </div>

        <div className="border border-slate-800 rounded bg-slate-950 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2">
              REGISTRO DE SINCRONIZACIÓN (PostgreSQL - {inboxDestino})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {historial.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No hay registros en este buzón.</p>
              ) : (
                historial.map((item) => (
                  <div key={item.id} className="p-2.5 border-l-2 border-blue-500 bg-slate-900 text-xs rounded space-y-1">
                    <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                      <span className="text-blue-400 font-bold">{item.codigo_expediente}</span>
                      <span suppressHydrationWarning>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-200">{item.comunicado}</p>
                    <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                      <span>Para: {item.destino}</span>
                      <span>De: {item.emisor_rol}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PANEL DEL DOCENTE CON BOTONES CSV Y TABLAS VISIBLES ---
function TeacherDashboard({ userProfile }: { userProfile: UserProfile | null }) {
  const [activeSubject] = useState<string>(userProfile?.subject || 'Matemáticas');
  const [activeTab, setActiveTab] = useState<"calificaciones" | "asistencia">("calificaciones");
  const [calificacionesData, setCalificacionesData] = useState<Calificacion[]>([]);
  const [asistenciaData, setAsistenciaData] = useState<AsistenciaRecord[]>([]);
  const [dashboardView, setDashboardView] = useState<'main' | 'matrix'>('main');

  const availableCourses = TEACHER_COURSES.default;
  const [selectedCourse, setSelectedCourse] = useState<string>(availableCourses[0]);
  const [studentsByCourse, setStudentsByCourse] = useState<Record<string, StudentData[]>>(INITIAL_STUDENTS_BY_COURSE);

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const currentCourseStudents = studentsByCourse[selectedCourse] || [];

  const handleFetchCalificaciones = async () => {
    const API_URL = getApiUrl();
    try {
      const res = await fetch(`${API_URL}/api/calificaciones`);
      if (res.ok) {
        const result = await res.json();
        if (Array.isArray(result)) {
          const filtered = result.filter((r: any) => r.course_id === selectedCourse);
          setCalificacionesData(filtered.length > 0 ? filtered : result);
        } else if (result && Array.isArray(result.data)) {
          const filtered = result.data.filter((r: any) => r.course_id === selectedCourse);
          setCalificacionesData(filtered.length > 0 ? filtered : result.data);
        } else {
          setCalificacionesData([]);
        }
      }
      setActiveTab('calificaciones');
    } catch (err) {
      console.error("Error al cargar Calificaciones:", err);
      setActiveTab('calificaciones');
    }
  };

  const handleFetchAsistencia = async () => {
    const API_URL = getApiUrl();
    try {
      const res = await fetch(`${API_URL}/api/asistencia`);
      if (res.ok) {
        const result = await res.json();
        if (Array.isArray(result)) {
          const filtered = result.filter((r: any) => r.course_id === selectedCourse);
          setAsistenciaData(filtered.length > 0 ? filtered : result);
        } else if (result && Array.isArray(result.data)) {
          const filtered = result.data.filter((r: any) => r.course_id === selectedCourse);
          setAsistenciaData(filtered.length > 0 ? filtered : result.data);
        } else {
          setAsistenciaData([]);
        }
      }
      setActiveTab('asistencia');
    } catch (err) {
      console.error("Error al cargar Asistencia:", err);
      setActiveTab('asistencia');
    }
  };

  useEffect(() => {
    handleFetchCalificaciones();
  }, [selectedCourse]);

  // --- CONFIRMAR CAMBIOS (Saves to PostgreSQL) ---

const saveCourseData = async () => {
    const API_URL = getApiUrl();
    try {
      const payloadGrades = {
        course_id: selectedCourse,
        teacher_username: userProfile?.username || 'teacher_math',
        students: currentCourseStudents.map((s) => ({
          id: s.id,
          name: s.name,
          grade: parseFloat(s.grade) || 0.0
        }))
      };

      const payloadAttendance = {
        course_id: selectedCourse,
        teacher_username: userProfile?.username || 'teacher_math',
        students: currentCourseStudents.map((s) => ({
          codigo: s.id,
          estudiante: s.name,
          asistencia: {
            LUN: s.attendance.lunes,
            MAR: s.attendance.martes,
            MIE: s.attendance.miercoles,
            JUE: s.attendance.jueves,
            VIE: s.attendance.viernes,
          }
        }))
      };

      const [resGrades, resAttendance] = await Promise.all([
        fetch(`${API_URL}/api/v1/courses/update-grades`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify(payloadGrades)
        }),
        fetch(`${API_URL}/api/v1/courses/update-attendance`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify(payloadAttendance)
        })
      ]);

      if (!resGrades.ok || !resAttendance.ok) {
        throw new Error(`Error en el servidor: ${resGrades.status} / ${resAttendance.status}`);
      }

      alert('¡Cambios guardados exitosamente en PostgreSQL!');
      handleFetchCalificaciones();
    } catch (error: any) {
      console.error('Error al sincronizar:', error);
      alert(`No se pudo guardar en el servidor. Asegúrate de que FastAPI esté corriendo.\nDetalle: ${error.message}`);
    }
  };
 
  // --- CSV DOWNLOAD HELPERS ---
  const exportCalificacionesCSV = () => {
    let csv = 'CODIGO,ESTUDIANTE,CALIFICACION\n';
    currentCourseStudents.forEach((s) => {
      csv += `"${s.id}","${s.name}",${s.grade}\n`;
    });
    downloadCSVFile(`Calificaciones_${selectedCourse.replace(/\s+/g, '_')}.csv`, csv);
  };

  const exportAsistenciaCSV = () => {
    let csv = 'CODIGO,ESTUDIANTE,LUN,MAR,MIE,JUE,VIE\n';
    currentCourseStudents.forEach((s) => {
      csv += `"${s.id}","${s.name}",${s.attendance.lunes ? 'P' : 'A'},${s.attendance.martes ? 'P' : 'A'},${s.attendance.miercoles ? 'P' : 'A'},${s.attendance.jueves ? 'P' : 'A'},${s.attendance.viernes ? 'P' : 'A'}\n`;
    });
    downloadCSVFile(`Asistencia_${selectedCourse.replace(/\s+/g, '_')}.csv`, csv);
  };

  const handleStudentUpdate = (id: string, key: keyof StudentData, value: any) => {
    let finalValue = value;
    if (key === 'grade' && typeof value === 'string') {
      finalValue = value.replace(',', '.');
    }
    setStudentsByCourse(prev => ({
      ...prev,
      [selectedCourse]: (prev[selectedCourse] || []).map(s =>
        s.id === id ? { ...s, [key]: finalValue } : s
      ),
    }));
  };

  const handleAttendanceChange = (id: string, day: keyof AttendanceDays, checked: boolean) => {
    setStudentsByCourse(prev => ({
      ...prev,
      [selectedCourse]: (prev[selectedCourse] || []).map(s =>
        s.id === id ? { ...s, attendance: { ...s.attendance, [day]: checked } } : s
      ),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-blue-400">Panel del Docente - {activeSubject}</h2>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-[#070b19] border border-slate-700 text-white rounded-lg p-2.5 text-sm"
          >
            {availableCourses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex flex-wrap gap-2 pt-2">
            <button 
              onClick={handleFetchCalificaciones} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'calificaciones' && dashboardView === 'main' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Calificaciones
            </button>
            <button 
              onClick={handleFetchAsistencia} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'asistencia' && dashboardView === 'main' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Asistencia
            </button>
            <button 
              onClick={() => setDashboardView(dashboardView === 'matrix' ? 'main' : 'matrix')} 
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer"
            >
              {dashboardView === 'matrix' ? 'Ver Tablas' : 'Consola Operativa'}
            </button>
          </div>
        </div>

        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Estado del Aula
            </span>
            <p className="text-base font-medium">
              Alumnos en {selectedCourse}: <span className="text-emerald-400 font-bold">{currentCourseStudents.length} Registrados</span>
            </p>
          </div>
          {/* BOTONES PRINCIPALES DE ACCIÓN DIRECTA */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
            <button 
              onClick={saveCourseData} 
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow cursor-pointer disabled:opacity-50"
            >
              {isSaving ? '⏳ Sincronizando...' : '💾 Confirmar Cambios'}
            </button>
            <button 
              onClick={exportCalificacionesCSV} 
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer"
            >
              📊 Descargar Calificaciones (CSV)
            </button>
            <button 
              onClick={exportAsistenciaCSV} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer"
            >
              📅 Descargar Asistencia (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* VISTA PRINCIPAL CON TABLAS */}
      {dashboardView === 'main' && (
        <div className="bg-[#0b1329] border border-blue-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">
              Registro de {activeTab.toUpperCase()} ({selectedCourse})
            </h3>
          </div>

          <div className="w-full bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden text-slate-900">
            {activeTab === 'calificaciones' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold text-xs uppercase border-b border-slate-200">
                      <th className="p-3 border-r">PK / ID</th>
                      <th className="p-3 border-r">Curso / Aula</th>
                      <th className="p-3 border-r">Estudiante</th>
                      <th className="p-3 border-r">Nota ({activeSubject})</th>
                      <th className="p-3">Sincronización</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm font-mono text-slate-800">
                    {currentCourseStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 border-r text-slate-500">{student.id}</td>
                        <td className="p-3 border-r font-medium text-slate-900">{selectedCourse}</td>
                        <td className="p-3 border-r">{student.name}</td>
                        <td className="p-3 border-r font-bold text-blue-600">{student.grade}</td>
                        <td className="p-3 text-xs text-slate-500" suppressHydrationWarning>
                          {new Date().toLocaleString('es-EC')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold text-xs uppercase border-b border-slate-200">
                      <th className="p-3 border-r">PK / ID</th>
                      <th className="p-3 border-r">Curso / Aula</th>
                      <th className="p-3 border-r">Estudiante</th>
                      <th className="p-3 border-r text-center">Lun</th>
                      <th className="p-3 border-r text-center">Mar</th>
                      <th className="p-3 border-r text-center">Mié</th>
                      <th className="p-3 border-r text-center">Jue</th>
                      <th className="p-3 border-r text-center">Vie</th>
                      <th className="p-3">Sincronización</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm font-mono text-slate-800">
                    {currentCourseStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 border-r text-slate-500">{student.id}</td>
                        <td className="p-3 border-r font-medium text-slate-900">{selectedCourse}</td>
                        <td className="p-3 border-r">{student.name}</td>
                        <td className="p-3 border-r text-center">{student.attendance.lunes ? '✅' : '❌'}</td>
                        <td className="p-3 border-r text-center">{student.attendance.martes ? '✅' : '❌'}</td>
                        <td className="p-3 border-r text-center">{student.attendance.miercoles ? '✅' : '❌'}</td>
                        <td className="p-3 border-r text-center">{student.attendance.jueves ? '✅' : '❌'}</td>
                        <td className="p-3 border-r text-center">{student.attendance.viernes ? '✅' : '❌'}</td>
                        <td className="p-3 text-xs text-slate-500" suppressHydrationWarning>
                          {new Date().toLocaleString('es-EC')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONSOLA OPERATIVA */}
      {dashboardView === 'matrix' && (
        <div className="p-6 bg-[#0b1329] border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h3 className="text-lg font-bold text-white">Consola de Edición Manual ({selectedCourse})</h3>
          </div>

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
                {currentCourseStudents.map((student: StudentData) => (
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
                        {DAYS_OF_WEEK.map((day) => (
                          <label key={day} className="flex flex-col items-center gap-1 cursor-pointer">
                            <span className="text-[9px] text-slate-500 uppercase">{String(day).slice(0, 3)}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ModuloDespachoDECE 
        cursoActual={selectedCourse} 
        materiaActual={activeSubject}
        emisorRol="Docente"
        inboxDestino="DECE"
      />
    </div>
  );
}

// --- OTROS PANELES ---
function DECEDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-purple-400">Panel DECE (Consejería Estudiantil)</h2>
      <ModuloDespachoDECE 
        cursoActual="General / DECE" 
        materiaActual="Seguimiento Psicopedagógico"
        emisorRol="DECE"
        inboxDestino="DECE"
      />
    </div>
  );
}

function VicerrectoradoDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-indigo-400">Panel Vicerrectorado Académico</h2>
      <ModuloDespachoDECE 
        cursoActual="General / Vicerrectorado" 
        materiaActual="Dirección Académica"
        emisorRol="Vicerrectora"
        inboxDestino="VICERRECTORADO"
      />
    </div>
  );
}

function RectoradoDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-emerald-400">Panel Rectorado / Despacho General</h2>
      <ModuloDespachoDECE 
        cursoActual="General / Rectorado" 
        materiaActual="Dirección General"
        emisorRol="Rectora"
        inboxDestino="RECTORADO"
      />
    </div>
  );
}

// --- ENRUTADOR PRINCIPAL Y LOGIN ---
export default function DashboardPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const activeRole: UserRole = getNormalizedRole(userProfile?.role);

  if (!isAuthenticated) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-950 font-sans p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-400">Sistema CTS</h1>
            <p className="text-xs text-slate-400 mt-2">Plataforma Integrada de Control Académico</p>
          </div>

          {error && <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-rose-400 text-xs text-center">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="teacher_math, dece_user, vicerrectora_user, rectora_user"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="........"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError('');
              const targetUser = username.trim().toLowerCase();
              const userRecord = USER_DATABASE[targetUser];

              if (userRecord && userRecord.password === password) {
                setUserProfile({
                  username: targetUser,
                  name: userRecord.name,
                  role: userRecord.role,
                  subject: userRecord.subject || 'General',
                });
                setIsAuthenticated(true);
              } else {
                setError('Usuario o contraseña incorrectos.');
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition text-sm cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 font-sans flex flex-col justify-between">
      <div>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 tracking-tight">Sistema CTS</h1>
            <p className="mt-1 text-slate-400 text-sm">Control Institucional Homologado</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3 text-sm">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Usuario Activo</span>
              <span className="font-bold text-slate-200">{userProfile?.name}</span>
              <span className="text-blue-400 text-xs block font-mono">Rol: {userProfile?.role}</span>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-[#0b1329] hover:bg-rose-900/40 border border-slate-800 text-xs text-slate-300 p-3 rounded-lg cursor-pointer"
            >
              Salir
            </button>
          </div>
        </header>

        <main>
          {activeRole === 'DECE' && <DECEDashboard />}
          {activeRole === 'VICERRECTORADO' && <VicerrectoradoDashboard />}
          {activeRole === 'RECTORADO' && <RectoradoDashboard />}
          {activeRole === 'DOCENTE' && <TeacherDashboard userProfile={userProfile} />}
        </main>
      </div>
    </div>
  );
}
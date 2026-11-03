import json
import os
import sys
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI
from backend.routers import courses, asistencia, dece, communications

# Si tus importaciones estÃ¡n asÃ­:
from backend.models import ComunicacionDECEModel

# O si estÃ¡s importando desde la misma carpeta backend:
from backend.models import ComunicacionDECEModel
import httpx
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import pytz

# Asegurar la resoluciÃ³n del directorio raÃ­z del backend
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# Importaciones directas desde el paquete backend
from backend.database import Base, engine, get_db
from backend.models import Asistencia, Calificacion
from backend.routers import calificaciones, courses, dece, despacho

# CreaciÃ³n de tablas ORM en PostgreSQL
Base.metadata.create_all(bind=engine)



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Dominios específicos permitidos
origins = [
    "https://app.cassatraining.com",
    "https://nextapp-1-eight.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]



from fastapi.middleware.cors import CORSMiddleware

# Configuración robusta de CORS para admitir Vercel, Localhost y cualquier ngrok activo
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.ngrok-free\.dev|https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers secundarios
app.include_router(courses.router)
app.include_router(dece.router)
app.include_router(despacho.router)
app.include_router(
    calificaciones.router,
    prefix="/api/calificaciones",  # <-- Must include /api/calificaciones
    tags=["Calificaciones"]
)
app.include_router(calificaciones.router)
app.include_router(calificaciones.router_courses)
app.include_router(asistencia.router)
app.include_router(communications.router)


# --- PYDANTIC SCHEMAS ---
class AttendanceDays(BaseModel):
    lunes: bool
    martes: bool
    miercoles: bool
    jueves: bool
    viernes: bool


class SaveRecordItem(BaseModel):
    student_id: str
    grade: float
    attendance: AttendanceDays


class SaveRecordsPayload(BaseModel):
    course_id: str
    records: List[SaveRecordItem]
    updated_at: Optional[str] = None


class DispatchPayload(BaseModel):
    case_code: Optional[str] = None
    destination: str
    observations: Optional[str] = None
    file_name: Optional[str] = None
    sender_role: Optional[str] = None


class LessonPlanRequest(BaseModel):
    subject: str
    grade_level: str
    topic: str
    duration_minutes: int = 45
    learning_objectives: str


# --- GENERAL ENDPOINTS ---
@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "Backend conectado y configurado correctamente"}


# --- DESPACHO DE REPORTES MULTI-DEPARTAMENTO ---
@app.post("/api/dece/comunicaciones")
def enviar_comunicado(payload: ComunicacionCreate, db: Session = Depends(get_db)):
    # Zona horaria de Ecuador para el sello de sincronizaciÃ³n
    tz_ec = pytz.timezone('America/Guayaquil')
    ahora = datetime.now(tz_ec)

    nuevo_mensaje = ComunicacionDECEModel(
        codigo_expediente=payload.codigo_expediente or "REPORTE-GENERAL",
        materia=payload.materia,
        curso=payload.curso,
        emisor_rol=payload.emisor_rol,
        emisor_id=payload.emisor_id,
        receptor_rol=payload.receptor_rol,
        comunicado=payload.comunicado,
        archivo_url=payload.archivo_url,
        estado="ENVIADO",
        sincronizado_en=ahora
    )
    db.add(nuevo_mensaje)
    db.commit()
    db.refresh(nuevo_mensaje)

    return {
        "status": "success",
        "message": "Comunicado sincronizado correctamente en PostgreSQL",
        "data": nuevo_mensaje
    }

@app.get("/api/dece/comunicaciones/{curso}")
def obtener_historial_curso(curso: str, db: Session = Depends(get_db)):
    mensajes = db.query(ComunicacionDECEModel)\
                 .filter(ComunicacionDECEModel.curso == curso)\
                 .order_by(ComunicacionDECEModel.sincronizado_en.desc())\
                 .all()
    return mensajes

@app.post("/api/v1/dispatch", tags=["Despacho Operativo"])
def dispatch_report(payload: DispatchPayload, db: Session = Depends(get_db)):
    """
    Guarda el reporte en la tabla correspondiente segÃºn el origen/rol emisor del payload.
    """
    dest = (payload.destination or "").upper()
    sender = (payload.sender_role or getattr(payload, 'sender_role', 'VICERRECTORADO') or 'VICERRECTORADO').upper()
    case_code_val = payload.case_code if payload.case_code else "CAS-GENERAL"

    # SelecciÃ³n dinÃ¡mica de tabla segÃºn origen
    if "RECT" in sender:
        table_name = "public.rectorado_reports"
        role_label = "Rectora"
    elif "DECE" in sender:
        table_name = "public.dece_reports"
        role_label = "DECE"
    else:
        table_name = "public.vicerrectorado_reports"
        role_label = "Vicerrectora"

    query = text(f"""
        INSERT INTO {table_name} 
            (case_code, student_name, course, report_type, title, description, sender_role, destination, observations, file_name, sent_at)
        VALUES 
            (:case_code, 'Estudiante General', '8vo EGB - Paralelo A', 'Novedades', 'Reporte Oficial', :observations, :sender_role, :destination, :observations, :file_name, NOW());
    """)

    try:
        db.execute(
            query,
            {
                "case_code": case_code_val,
                "sender_role": role_label,
                "destination": payload.destination,
                "observations": payload.observations,
                "file_name": payload.file_name,
            },
        )
        db.commit()
        return {"status": "success", "message": f"Reporte guardado exitosamente en {table_name}"}
    except Exception as e:
        db.rollback()
        print("Error al despachar reporte:", str(e))
        raise HTTPException(
            status_code=500, detail=f"Error en base de datos al guardar reporte: {str(e)}"
        )


# --- CONSULTA UNIFICADA CON FEEDBACK BIDIRECCIONAL ---
@app.get("/api/reportes", tags=["Despacho Operativo"])
def get_reportes(origen: str, destino: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Combina dece_reports, vicerrectorado_reports y rectorado_reports para ofrecer feedback cruzado.
    """
    try:
        origen_clean = origen.upper() if origen else ""
        destino_clean = destino.upper() if destino else ""

        sql = """
            SELECT id, case_code, origen, destino, observations AS observaciones, file_name AS archivo, sent_at AS fecha_envio
            FROM (
                SELECT id, case_code, 'DECE' AS origen, UPPER(destination) AS destino, observations, file_name, sent_at 
                FROM public.dece_reports
                
                UNION ALL
                
                SELECT id, case_code, 'VICERRECTORADO' AS origen, UPPER(destination) AS destino, observations, file_name, sent_at 
                FROM public.vicerrectorado_reports
                
                UNION ALL
                
                SELECT id, case_code, 'RECTORADO' AS origen, UPPER(destination) AS destino, observations, file_name, sent_at 
                FROM public.rectorado_reports
            ) AS reportes_totales
            WHERE 1=1
        """
        params = {}

        if destino_clean == "DESPACHADOS":
            sql += " AND origen = :origen"
            params["origen"] = origen_clean
        elif destino_clean and destino_clean != "TODOS":
            sql += " AND ((origen = :origen AND destino = :destino) OR (origen = :destino AND destino = :origen))"
            params["origen"] = origen_clean
            params["destino"] = destino_clean
        else:
            sql += " AND (origen = :origen OR destino = :origen)"
            params["origen"] = origen_clean

        sql += " ORDER BY fecha_envio DESC;"

        result = db.execute(text(sql), params).mappings().all()
        return list(result)

    except Exception as e:
        print("Error al consultar la uniÃ³n de reportes:", str(e))
        raise HTTPException(
            status_code=500, detail=f"Error al obtener historial de reportes: {str(e)}"
        )


# --- DECE QUERY ENDPOINT ---
@app.get("/api/v1/dece-reports", tags=["DECE"])
def get_dece_reports(db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT id, case_code, destination, observations, file_name, sent_at
            FROM public.dece_reports
            ORDER BY sent_at DESC;
        """)
        result = db.execute(query).mappings().all()
        return list(result)
    except Exception as e:
        print("Error al consultar reportes DECE:", str(e))
        raise HTTPException(
            status_code=500, detail=f"Error al obtener reportes: {str(e)}"
        )


# --- ATOMIC SAVE-RECORDS ENDPOINT ---
@app.post("/api/v1/academics/save-records", tags=["Academics"])
def save_records(payload: SaveRecordsPayload, db: Session = Depends(get_db)):
    try:
        grade_query = text("""
            INSERT INTO public.calificaciones (course_id, student_id, grade, updated_at)
            VALUES (:course_id, :student_id, :grade, NOW())
            ON CONFLICT (student_id, course_id) 
            DO UPDATE SET 
                grade = EXCLUDED.grade,
                updated_at = NOW();
        """)

        attendance_query = text("""
            INSERT INTO public.asistencia 
                (course_id, student_id, lunes, martes, miercoles, jueves, viernes, updated_at)
            VALUES 
                (:course_id, :student_id, :lunes, :martes, :miercoles, :jueves, :viernes, NOW())
            ON CONFLICT (student_id, course_id) 
            DO UPDATE SET 
                lunes = EXCLUDED.lunes,
                martes = EXCLUDED.martes,
                miercoles = EXCLUDED.miercoles,
                jueves = EXCLUDED.jueves,
                viernes = EXCLUDED.viernes,
                updated_at = NOW();
        """)

        for rec in payload.records:
            db.execute(
                grade_query,
                {
                    "course_id": payload.course_id,
                    "student_id": rec.student_id,
                    "grade": rec.grade,
                },
            )
            db.execute(
                attendance_query,
                {
                    "course_id": payload.course_id,
                    "student_id": rec.student_id,
                    "lunes": rec.attendance.lunes,
                    "martes": rec.attendance.martes,
                    "miercoles": rec.attendance.miercoles,
                    "jueves": rec.attendance.jueves,
                    "viernes": rec.attendance.viernes,
                },
            )

        db.commit()
        return {
            "status": "success",
            "message": "Calificaciones y asistencia guardadas correctamente",
        }

    except Exception as e:
        db.rollback()
        print("CRITICAL DATABASE ERROR EN SAVE-RECORDS:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# --- ACADEMIC TABLES QUERY ENDPOINTS ---
@app.get("/api/v1/calificaciones", tags=["Calificaciones"])
def get_calificaciones(db: Session = Depends(get_db)):
    return db.query(Calificacion).order_by(Calificacion.id.asc()).all()

@app.get("/api/calificaciones")
def get_calificaciones():
    return {"status": "ok", "message": "Endpoint de calificaciones activo"}


@app.get("/api/v1/asistencia", tags=["Asistencia"])
def get_asistencia(db: Session = Depends(get_db)):
    return db.query(Asistencia).order_by(Asistencia.id.asc()).all()

@app.get("/api/asistencia")
def get_asistencia():
    return {"status": "ok", "message": "Endpoint de asistencia activo"}


# --- LESSON PLAN GENERATION ENDPOINT ---
@app.post("/api/ai/generate-lesson-plan", tags=["IA Generativa"])
async def generate_lesson_plan(request: LessonPlanRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="Falta la variable de entorno GEMINI_API_KEY"
        )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    prompt = f"""
    You are an expert high school curriculum designer. 
    Create a structured lesson plan for:
    - Subject: {request.subject}
    - Grade Level: {request.grade_level}
    - Topic: {request.topic}
    - Class Duration: {request.duration_minutes} minutes
    - Key Objectives: {request.learning_objectives}

    Return the response strictly as a valid JSON object matching this structure:
    {{
      "title": "Lesson title",
      "overview": "Short summary",
      "timeline": [
        {{"time": "0-10 min", "activity": "Introduction and warm-up"}},
        {{"time": "10-30 min", "activity": "Main instructional task"}},
        {{"time": "30-45 min", "activity": "Wrap-up and evaluation"}}
      ],
      "assessment": "Brief check for understanding method"
    }}
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"},
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30.0)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        data = response.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw_text)

    except Exception as e:
        print("ERROR EN GENERACION DE PLAN DE CLASE:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

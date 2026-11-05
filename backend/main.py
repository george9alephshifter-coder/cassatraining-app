import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import httpx
import pytz
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

# Asegurar la resolución del directorio raíz del backend
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# Importaciones locales directas (ya que main.py está dentro de backend)
from database import Base, engine, get_db
from models import Asistencia, Calificacion, ComunicacionDECEModel
from routers import asistencia, calificaciones, communications, courses, dece, despacho

# Creación de tablas ORM en PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema CTS Backend", version="1.0.0")

# Configuración robusta de CORS para Vercel, Localhost y Ngrok
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
    prefix="/api/calificaciones",
    tags=["Calificaciones"],
)
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


class ComunicacionCreate(BaseModel):
    codigo_expediente: Optional[str] = None
    materia: str
    curso: str
    emisor_rol: str
    emisor_id: str
    receptor_rol: str
    comunicado: str
    archivo_url: Optional[str] = None


# --- GENERAL ENDPOINTS ---
@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "Backend conectado y configurado correctamente"}


# --- DESPACHO DE REPORTES MULTI-DEPARTAMENTO ---
@app.post("/api/dece/comunicaciones", tags=["DECE"])
def enviar_comunicado(payload: ComunicacionCreate, db: Session = Depends(get_db)):
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


@app.get("/api/dece/comunicaciones/{curso}", tags=["DECE"])
def obtener_historial_curso(curso: str, db: Session = Depends(get_db)):
    mensajes = db.query(ComunicacionDECEModel)\
                 .filter(ComunicacionDECEModel.curso == curso)\
                 .order_by(ComunicacionDECEModel.sincronizado_en.desc())\
                 .all()
    return mensajes


@app.post("/api/v1/dispatch", tags=["Despacho Operativo"])
def dispatch_report(payload: DispatchPayload, db: Session = Depends(get_db)):
    dest = (payload.destination or "").upper()
    sender = (payload.sender_role or 'VICERRECTORADO').upper()
    case_code_val = payload.case_code if payload.case_code else "CAS-GENERAL"

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
        raise HTTPException(
            status_code=500, detail=f"Error en base de datos al guardar reporte: {str(e)}"
        )


@app.get("/api/reportes", tags=["Despacho Operativo"])
def get_reportes(origen: str, destino: Optional[str] = None, db: Session = Depends(get_db)):
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
        raise HTTPException(
            status_code=500, detail=f"Error al obtener historial de reportes: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500, detail=f"Error al obtener reportes: {str(e)}"
        )


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
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/calificaciones", tags=["Calificaciones"])
def get_calificaciones(db: Session = Depends(get_db)):
    return db.query(Calificacion).order_by(Calificacion.id.asc()).all()


@app.get("/api/v1/asistencia", tags=["Asistencia"])
def get_asistencia(db: Session = Depends(get_db)):
    return db.query(Asistencia).order_by(Asistencia.id.asc()).all()


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
        raise HTTPException(status_code=500, detail=str(e))

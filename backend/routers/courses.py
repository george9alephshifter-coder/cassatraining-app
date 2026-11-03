from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime  # 👈 Native datetime import

from backend.database import get_db
from backend.models import Calificacion
from backend.database import get_db
from backend.models import User

from fastapi import APIRouter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
# from backend.database import get_db
# from backend.models import StudentModel  # Illustrative working assumption for your DB model

router = APIRouter()

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict
from sqlalchemy.orm import Session
# from backend.database import get_db  # Ajusta según tu importación

router = APIRouter()

# 1. Modelos que coinciden exactamente con el frontend
class GradeItem(BaseModel):
    codigo: str
    estudiante: str
    calificacion: float

class AttendanceItem(BaseModel):
    codigo: str
    estudiante: str
    asistencia: Dict[str, bool]

# 2. Endpoint de Calificaciones
@router.put("/api/v1/courses/update-grades")
async def update_grades(payload: List[GradeItem]):
    try:
        for item in payload:
            print(f"Actualizando nota para {item.codigo} ({item.estudiante}): {item.calificacion}")
            # AQUÍ TU LÓGICA DE POSTGRESQL PARA GUARDAR CALIFICACIONES
            
        return {"success": True, "message": "Calificaciones actualizadas correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. Endpoint de Asistencia
@router.put("/api/v1/courses/update-attendance")
async def update_attendance(payload: List[AttendanceItem]):
    try:
        for item in payload:
            print(f"Actualizando asistencia para {item.codigo}: {item.asistencia}")
            # AQUÍ TU LÓGICA DE POSTGRESQL PARA GUARDAR ASISTENCIA
            
        return {"success": True, "message": "Asistencia actualizada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
# from backend.database import get_db

router = APIRouter()

@router.get("/api/calificaciones")
async def get_calificaciones():
    # Retorna las calificaciones registradas (puedes adaptarlo a tu consulta de SQLAlchemy)
    return []

@router.get("/api/asistencia")
async def get_asistencia():
    # Retorna los registros de asistencia
    return []




def update_grades(payload: dict, db: Session = Depends(get_db)):
    try:
        raw_course = (
            payload.get("course_id") or 
            payload.get("course") or 
            payload.get("curso") or ""
        )
        course_id = raw_course.split(" (")[0].strip() if "(" in raw_course else raw_course.strip()

        grades_list = (
            payload.get("grades") or 
            payload.get("calificaciones") or 
            payload.get("students") or []
        )

        updated_count = 0

        for item in grades_list:
            student_id = item.get("student_id") or item.get("codigo") or item.get("id")
            
            grade_val = item.get("grade")
            if grade_val is None:
                grade_val = item.get("calificacion")
            if grade_val is None:
                grade_val = item.get("nota")

            if not student_id or grade_val is None:
                continue

            record = db.query(Calificacion).filter(
                Calificacion.course_id == course_id,
                Calificacion.student_id == student_id
            ).first()

            # Use datetime.now() for local system time
            current_local_time = datetime.now()

            if record:
                record.grade = float(grade_val)
                record.updated_at = current_local_time  # 👈 Fixed timezone
            else:
                new_record = Calificacion(
                    course_id=course_id,
                    student_id=student_id,
                    grade=float(grade_val),
                    updated_at=current_local_time  # 👈 Fixed timezone
                )
                db.add(new_record)

            updated_count += 1

        db.commit()

        return {
            "status": "success",
            "message": f"Successfully updated {updated_count} records for {course_id}",
            "updated_count": updated_count,
            "course_id": course_id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
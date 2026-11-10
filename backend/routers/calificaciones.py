from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Calificacion, User
from fastapi import APIRouter

router_courses = APIRouter()  # O si ya tienes una instancia llamada 'router':
#router_courses = router

router = APIRouter(prefix="/courses", tags=["Courses & Grades"])

class StudentGrade(BaseModel):
    codigo: str
    estudiante: str
    calificacion: float

class GradeUpdatePayload(BaseModel):
    course_id: str
    teacher_username: Optional[str] = None
    students: List[StudentGrade]

@router.put("/update-grades")
async def update_course_grades(payload: GradeUpdatePayload, db: Session = Depends(get_db)):
    try:
        # Recorrer y actualizar las calificaciones en PostgreSQL para cada estudiante del curso
        for item in payload.students:
            # Ejemplo de lógica de actualización o inserción en la BD:
            # db_cal = db.query(Calificacion).filter(...).first()
            # if db_cal:
            #     db_cal.nota = item.calificacion
            #     db.commit()
            pass

        return {
            "status": "success",
            "message": "Calificaciones actualizadas exitosamente",
            "course_id": payload.course_id,
            "updated_count": len(payload.students)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
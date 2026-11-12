from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Calificacion
from backend.models import Calificacion, Asistencia

router = APIRouter(prefix="/api/v1/courses", tags=["Courses & Grades"])
router_courses = router

class StudentGradeItem(BaseModel):
    id: str
    name: Optional[str] = None
    grade: float

class GradeUpdateRequest(BaseModel):
    course_id: str
    teacher_username: Optional[str] = None
    students: List[StudentGradeItem]

@router.put("/update-grades")
async def update_grades(payload: GradeUpdateRequest, db: Session = Depends(get_db)):
    try:
        updated_count = 0
        for item in payload.students:
            db_cal = db.query(Calificacion).filter(Calificacion.codigo == item.id).first()
            if db_cal:
                db_cal.calificacion = item.grade
                updated_count += 1

        db.commit()
        return {
            "status": "success",
            "message": "Calificaciones actualizadas exitosamente",
            "updated_count": updated_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
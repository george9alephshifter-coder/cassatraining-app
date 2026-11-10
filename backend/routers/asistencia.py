from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Asistencia
from backend.database import get_db
from backend.models import User
from backend.models import Role, User, Asistencia  # Use 'backend.models' consistently

router = APIRouter(prefix="/api/asistencia", tags=["asistencia"])

async def process_asistencia_payload(request: Request, db: Session):
    try:
        raw_body = await request.json()
        print(">>> [DEBUG ASISTENCIA] RECEIVED PAYLOAD:", raw_body)

        # Handle payload if sent directly as a list [...] vs object {...}
        if isinstance(raw_body, list):
            attendance_list = raw_body
            course_id = ""
        else:
            raw_course = (
                raw_body.get("course_id") or 
                raw_body.get("course") or 
                raw_body.get("curso") or ""
            )
            course_id = raw_course.split(" (")[0].strip() if "(" in raw_course else raw_course.strip()
            attendance_list = (
                raw_body.get("attendance") or 
                raw_body.get("asistencia") or 
                raw_body.get("students") or 
                raw_body.get("estudiantes") or 
                raw_body.get("data") or []
            )

        updated_count = 0
        current_time = datetime.now()

        for item in attendance_list:
            if not isinstance(item, dict):
                continue

            student_id = item.get("student_id") or item.get("codigo") or item.get("id")
            if not student_id:
                continue

            item_course = item.get("course_id") or item.get("course") or course_id
            item_course = item_course.split(" (")[0].strip() if "(" in item_course else item_course.strip()

            # Find existing row in database
            query = db.query(Asistencia).filter(Asistencia.student_id == student_id)
            if item_course:
                query = query.filter(Asistencia.course_id == item_course)
            record = query.first()

            # Helper function for boolean conversion
            def parse_bool(val):
                if isinstance(val, str):
                    return val.lower() in ("true", "1", "p", "presente", "yes", "y", "t")
                return bool(val)

            lunes = parse_bool(item.get("lunes", False))
            martes = parse_bool(item.get("martes", False))
            
            # ⚠️ Fix: Check both accented 'miércoles' and unaccented 'miercoles'
            miercoles_val = item.get("miercoles") if item.get("miercoles") is not None else item.get("miércoles", False)
            miercoles = parse_bool(miercoles_val)
            
            jueves = parse_bool(item.get("jueves", False))
            viernes = parse_bool(item.get("viernes", False))

            if record:
                if item_course:
                    record.course_id = item_course
                record.lunes = lunes
                record.martes = martes
                record.miercoles = miercoles
                record.jueves = jueves
                record.viernes = viernes
                record.updated_at = current_time
            else:
                new_record = Asistencia(
                    course_id=item_course or "8vo EGB - Paralelo A",
                    student_id=student_id,
                    lunes=lunes,
                    martes=martes,
                    miercoles=miercoles,
                    jueves=jueves,
                    viernes=viernes,
                    updated_at=current_time
                )
                db.add(new_record)

            updated_count += 1

        db.commit()
        print(f">>> [SUCCESS] Successfully updated {updated_count} attendance records at {current_time}!")

        return {
            "status": "success",
            "message": f"Updated {updated_count} records",
            "updated_count": updated_count
        }

    except Exception as e:
        db.rollback()
        print(">>> [ERROR ASISTENCIA]:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
@router.post("/")
@router.post("/update")
@router.post("/guardar")
@router.put("")
@router.put("/")
@router.put("/update")
@router.put("/guardar")
async def update_asistencia_route(request: Request, db: Session = Depends(get_db)):
    return await process_asistencia_payload(request, db)
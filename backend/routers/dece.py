from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from backend.database import get_db
from backend.models import User

# Fixed backend relative imports
from backend.database import get_db
from backend.models import DECEReport

router = APIRouter(prefix="/api/dece", tags=["DECE Reports"])

class ComunicacionSchema(BaseModel):
    codigo_expediente: str
    materia: str
    curso: str
    emisor_rol: str
    emisor_id: str
    comunicado: str  # o el nombre que uses para las observaciones
    destino: str | None = None

    # 2. Asignar el esquema al parámetro del endpoint
@router.post("/api/dece/comunicaciones")
async def crear_comunicado(payload: ComunicadoCreate):
    # FastAPI ahora extraerá automáticamente los datos del body enviado en la línea 143
    print("Datos guardados:", payload.model_dump())
    return {"status": "ok", "mensaje": "Comunicado sincronizado con éxito"}

class ReportCreate(BaseModel):
    case_code: str
    student_name: str
    course: str
    report_type: str
    title: str
    description: Optional[str] = None
    sender_role: str
    priority: str = "Media"
    status: str = "Pendiente"

class ReportResponse(ReportCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/reports", response_model=List[ReportResponse])
def get_reports_by_type(
    report_type: str = Query(..., description="Types: docentes, vicerrectora, rectora, despachados"),
    db: Session = Depends(get_db)
):
    return (
        db.query(DECEReport)
        .filter(DECEReport.report_type == report_type)
        .order_by(DECEReport.created_at.desc())
        .all()
    )

@router.post("/reports", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    db_report = DECEReport(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.post("/api/dece/comunicaciones")
def crear_comunicacion(data: ComunicacionSchema, db: Session = Depends(get_db)):
    nuevo_mensaje = ComunicacionDECEModel(
        codigo_expediente=data.codigo_expediente,
        materia=data.materia,
        curso=data.curso,
        emisor_rol=data.emisor_rol,
        emisor_id=data.emisor_id,
        receptor_rol=data.receptor_rol,
        comunicado=data.comunicado
    )
    db.add(nuevo_mensaje)
    db.commit()          # 👈 OBLIGATORIO: Si falta esto, la tabla sigue vacía en pgAdmin
    db.refresh(nuevo_mensaje)
    return nuevo_mensaje
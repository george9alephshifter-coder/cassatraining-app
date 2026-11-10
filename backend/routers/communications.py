from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from backend.database import get_db
from backend import models, schemas
from backend.schemas import ComunicadoCreate  # <--- Asegúrate de que esta importación exista y sea correcta
from backend.database import get_db
from backend.models import User


router = APIRouter(prefix="/comunicaciones", tags=["Communications"])

@router.post("", response_model=schemas.ComunicacionOut, status_code=status.HTTP_201_CREATED)
def crear_comunicacion(payload: schemas.ComunicacionCreate, db: Session = Depends(get_db)):
    try:
        nueva_comunicacion = models.Comunicacion(
            codigo_expediente=payload.codigo_expediente or "Sin Expediente Asignado",
            materia=payload.materia,
            curso=payload.curso,
            emisor_rol=payload.emisor_rol,
            emisor_id=payload.emisor_id,
            comunicado=payload.comunicado,
            destino=payload.destino.upper(),
            created_at=datetime.utcnow()
        )
        db.add(nueva_comunicacion)
        db.commit()
        db.refresh(nueva_comunicacion)
        return nueva_comunicacion
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{query_param}", response_model=List[schemas.ComunicacionOut])
def obtener_comunicaciones(query_param: str, db: Session = Depends(get_db)):
    param_upper = query_param.upper()
    return db.query(models.Comunicacion)\
             .filter(
                 (models.Comunicacion.destino == param_upper) | 
                 (models.Comunicacion.curso == query_param)
             )\
             .order_by(models.Comunicacion.created_at.desc())\
             .all()

@router.get("/{destino}", response_model=List[schemas.ComunicacionOut])
def obtener_comunicaciones(destino: str, db: Session = Depends(get_db)):
    return db.query(models.Comunicacion)\
             .filter(models.Comunicacion.destino == destino.upper())\
             .order_by(models.Comunicacion.created_at.desc())\
             .all()
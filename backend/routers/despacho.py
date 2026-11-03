import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from backend.models import ReporteDespacho, VicerrectoradoReport, RectoradoReport
from fastapi import APIRouter, Depends, FastAPI, File, Form, Header, HTTPException, UploadFile, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# ==========================================
# 1. DATABASE CONFIGURATION
# ==========================================
DATABASE_URL = "sqlite:///./despacho.db"  # Cambiar por tu URL de PostgreSQL/MySQL si aplica

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. ENUMS & PYDANTIC SCHEMAS
# ==========================================
class UserRole(str, Enum):
    DOCENTE = "DOCENTE"
    DECE = "DECE"
    VICERRECTORADO = "VICERRECTORADO"
    RECTORADO = "RECTORADO"

class TargetDestination(str, Enum):
    DOCENTES = "DOCENTES"
    DECE = "DECE"
    VICERRECTORADO = "VICERRECTORADO"
    RECTORADO = "RECTORADO"

class ReporteDespachoResponse(BaseModel):
    id: str
    codigo_caso: str
    destino: TargetDestination
    observaciones: Optional[str] = None
    archivo_nombre: Optional[str] = None
    archivo_url: Optional[str] = None
    fecha_envio: datetime
    remitente_rol: UserRole

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# 3. SQLALCHEMY ORM MODELS
# ==========================================
class ReporteDespacho(Base):
    __tablename__ = "reportes_despachados"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    codigo_caso = Column(String(100), nullable=False, default="CAS-GENERAL")
    destino = Column(String(50), nullable=False)
    observaciones = Column(Text, nullable=True)
    archivo_nombre = Column(String(255), nullable=True)
    archivo_url = Column(String(500), nullable=True)
    fecha_envio = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    remitente_rol = Column(String(50), nullable=False)

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

# ==========================================
# 4. FASTAPI ROUTER & ENDPOINTS
# ==========================================
router = APIRouter(prefix="/api/reportes", tags=["Despacho Operativo"])

@router.post("/despachar", response_model=ReporteDespachoResponse, status_code=status.HTTP_201_CREATED)
async def despachar_reporte(
    codigo_caso: str = Form("CAS-GENERAL"),
    observaciones: str = Form(""),
    destino: TargetDestination = Form(...),
    archivo: Optional[UploadFile] = File(None),
    x_user_role: UserRole = Header(..., alias="X-User-Role"),
    db: Session = Depends(get_db)
):
    # Regla de Negocio: Restricción de permisos según Rol del Remitente
    if x_user_role == UserRole.DOCENTE and destino != TargetDestination.DECE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los docentes únicamente pueden enviar reportes o retroalimentación al DECE."
        )

    archivo_nombre = None
    archivo_url = None

    if archivo:
        archivo_nombre = archivo.filename
        # Lógica opcional: guardar archivo en almacenamiento local o S3 y generar archivo_url

    nuevo_reporte = ReporteDespacho(
        codigo_caso=codigo_caso,
        destino=destino.value,
        observaciones=observaciones,
        archivo_nombre=archivo_nombre,
        archivo_url=archivo_url,
        remitente_rol=x_user_role.value
    )

    db.add(nuevo_reporte)
    db.commit()
    db.refresh(nuevo_reporte)

    return nuevo_reporte

@router.get("/historial", response_model=List[ReporteDespachoResponse])
def obtener_historial(
    db: Session = Depends(get_db)
):
    return db.query(ReporteDespacho).order_by(ReporteDespacho.fecha_envio.desc()).all()

# ==========================================
# 5. FASTAPI MAIN APPLICATION
# ==========================================
app = FastAPI(title="Sistema de Despacho Operativo")
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
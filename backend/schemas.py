from pydantic import BaseModel, Field
from uuid import UUID, uuid4
from typing import Optional, List
from datetime import datetime

class ComunicadoCreate(BaseModel):
    titulo: str
    contenido: str
    destinatario: Optional[str] = None  # Ejemplo: "todos", "cursos", "profesores", etc.

# Alias para compatibilidad total con routers que usen "ComunicacionCreate"
ComunicacionCreate = ComunicadoCreate

class ComunicacionOut(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    titulo: str
    contenido: str
    destinatario: Optional[str] = None
    fecha_creacion: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class CalificacionUpdate(BaseModel):
    estudiante_id: UUID
    materia_id: UUID
    periodo_evaluacion: str
    nota: float = Field(..., ge=0.0, le=10.0, description="Nota debe estar entre 0.00 y 10.00")
    docente_id: Optional[UUID] = None

class CalificacionResponse(BaseModel):
    mensaje: str
    estudiante_id: UUID
    materia_id: UUID
    nota_actualizada: float
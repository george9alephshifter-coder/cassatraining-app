from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional

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
from fastapi import APIRouter, HTTPException, Depends
from backend.schemas import CalificacionUpdate, CalificacionResponse

router = APIRouter(prefix="/calificaciones", tags=["Calificaciones"])

@router.put("/actualizar", response_model=CalificacionResponse)
async def actualizar_nota(data: CalificacionUpdate):
    # Aquí iría la lógica de actualización en PostgreSQL
    return {
        "mensaje": "Calificación actualizada exitosamente",
        "estudiante_id": data.estudiante_id,
        "materia_id": data.materia_id,
        "nota_actualizada": data.nota
    }
from fastapi import APIRouter, HTTPException, Depends
from backend.schemas import CalificacionUpdate, CalificacionResponse
from backend.database import get_db
from backend.models import User

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
# Agrega esto al final de backend/routers/calificaciones.py
router_courses = router  # O el nombre de tu APIRouter principal en este archivo (ej. router)
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone, date
from backend.database import Base

    # ... rest of your columns
class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users" 
    __table_args__ = {'extend_existing': True}
   
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    role = relationship("Role", back_populates="users")
    evaluations_created = relationship("Evaluation", foreign_keys="[Evaluation.teacher_id]", back_populates="teacher")
    evaluations_received = relationship("Evaluation", foreign_keys="[Evaluation.student_id]", back_populates="student")
    calificaciones = relationship("Calificacion", back_populates="student")
    asistencias = relationship("Asistencia", back_populates="student")

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    comments = Column(Text, nullable=True)
    score = Column(String(10), nullable=True)
    
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="evaluations_created")
    student = relationship("User", foreign_keys=[student_id], back_populates="evaluations_received")

class Calificacion(Base):
    __tablename__ = "calificaciones"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False)
    observacion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", back_populates="calificaciones")

class Asistencia(Base):
    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    status = Column(String(20), nullable=False)
    justification = Column(Text, nullable=True)

    student = relationship("User", back_populates="asistencias")

class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

class Comunicacion(Base):
    __tablename__ = "comunicaciones"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DeceRecord(Base):
    __tablename__ = "dece_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ComunicacionDECEModel(Base):
    __tablename__ = "comunicaciones_dece"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    titulo = Column(String, nullable=False)
    contenido = Column(Text, nullable=False)
    destinatario = Column(String, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

class ReporteDespacho(Base):
    __tablename__ = "reportes_despacho"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class VicerrectoradoReport(Base):
    __tablename__ = "vicerrectorado_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class RectoradoReport(Base):
    __tablename__ = "rectorado_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Alias de compatibilidad
Course = Curso
Dece = DeceRecord
DECEReport = DeceRecord
ComunicacionModel = ComunicacionDECEModel
ComunicacionDECE = ComunicacionDECEModel
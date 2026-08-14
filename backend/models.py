from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database import Base  # <-- CORREGIDO: Importamos la Base común

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # 'admin', 'teacher', 'director'
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    # CORREGIDO: Usar timezone-aware utcnow alternativo para evitar warnings
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    role = relationship("Role", back_populates="users")
    evaluations_created = relationship("Evaluation", foreign_keys="[Evaluation.teacher_id]", back_populates="teacher")
    evaluations_received = relationship("Evaluation", foreign_keys="[Evaluation.student_id]", back_populates="student")

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
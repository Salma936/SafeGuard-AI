from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    category = Column(String, default="Digital Safety Investigation")
    summary = Column(Text, nullable=True)
    status = Column(String, default="NEW")  # NEW, INVESTIGATING, RESOLVED, ARCHIVED
    risk_level = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Integer, default=50)
    threat_type = Column(String, default="Other Suspicious Activity")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    evidence_items = relationship("Evidence", back_populates="incident", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="incident", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="incident", cascade="all, delete-orphan")
    analysis_results = relationship("AnalysisResult", back_populates="incident", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(String, primary_key=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    type = Column(String, nullable=False)  # text, url, image, screenshot, audio, document
    evidence_type = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    title = Column(String, nullable=True)
    filename = Column(String, nullable=True)
    content_location = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    sha256_hash = Column(String, nullable=False)
    analysis_status = Column(String, default="PENDING")  # PENDING, COMPLETED, FAILED
    
    incident = relationship("Incident", back_populates="evidence_items")
    analysis_results = relationship("AnalysisResult", back_populates="evidence", cascade="all, delete-orphan")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(String, primary_key=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    evidence_id = Column(String, ForeignKey("evidence.id"), nullable=True)
    risk_level = Column(String, nullable=False)
    risk_score = Column(Integer, default=0)
    confidence = Column(Integer, default=0)
    threat_type = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    explanation_simple = Column(Text, nullable=True)
    warning_signs = Column(JSON, default=list)
    indicators = Column(JSON, default=list)
    tactics_observed = Column(JSON, default=list)
    recommended_actions = Column(JSON, default=list)
    affected_accounts = Column(JSON, default=list)
    evidence_relationships = Column(JSON, default=list)
    timeline_events = Column(JSON, default=list)
    potential_impact = Column(Text, nullable=True)
    origin_assessment = Column(Text, nullable=True)
    observed_evidence = Column(JSON, default=list)
    ai_inference = Column(JSON, default=list)
    uncertainty = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="analysis_results")
    evidence = relationship("Evidence", back_populates="analysis_results")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    
    id = Column(String, primary_key=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    timestamp = Column(String, nullable=False)
    phase = Column(String, default="Contact")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    related_evidence_ids = Column(JSON, default=list)
    severity = Column(String, default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="timeline_events")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(String, primary_key=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    category = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String, default="recommended")
    is_completed = Column(Integer, default=0)
    action_type = Column(String, default="guide")
    action_target = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="recommendations")

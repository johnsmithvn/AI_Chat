"""
Common Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional


class ContextSchema(BaseModel):
    """Context information from AI Core"""
    context_type: Optional[str] = Field(None, description="Type of context (casual_chat, technical_question, etc.)")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence level 0.0-1.0")
    should_refuse: bool = Field(False, description="Whether AI should refuse to answer")


class UsageSchema(BaseModel):
    """Token usage information"""
    prompt_tokens: Optional[int] = Field(None, ge=0)
    completion_tokens: Optional[int] = Field(None, ge=0)


class MetadataSchema(BaseModel):
    """AI metadata from AI Core"""
    persona: Optional[str] = Field(None, description="Selected persona (Casual, Technical, Cautious)")
    context: Optional[ContextSchema] = None
    model: Optional[str] = Field(None, description="Model name used")
    usage: Optional[UsageSchema] = None
    valid: bool = Field(True, description="Whether output passed validation")
    warnings: list[str] = Field(default_factory=list, description="Any warnings")

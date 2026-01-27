"""
Common Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional


class ContextSchema(BaseModel):
    """Context information from AI Core"""
    context_type: str = Field(..., description="Type of context (casual_chat, technical_question, etc.)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level 0.0-1.0")
    should_refuse: bool = Field(False, description="Whether AI should refuse to answer")


class UsageSchema(BaseModel):
    """Token usage information"""
    prompt_tokens: int = Field(..., ge=0)
    completion_tokens: int = Field(..., ge=0)


class MetadataSchema(BaseModel):
    """AI metadata from AI Core"""
    persona: str = Field(..., description="Selected persona (Casual, Technical, Cautious)")
    context: ContextSchema
    model: str = Field(..., description="Model name used")
    usage: UsageSchema
    valid: bool = Field(True, description="Whether output passed validation")
    warnings: list[str] = Field(default_factory=list, description="Any warnings")

"""
Common Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional


class ContextSchema(BaseModel):
    """Context information from AI Core"""
    context_type: Optional[str] = Field(None, description="Type of context (casual, technical)")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="DEPRECATED: Use signal_strength")
    signal_strength: Optional[float] = Field(None, ge=0.0, le=1.0, description="v2.1: Keyword signal strength (NOT probability)")
    context_clarity: Optional[bool] = Field(None, description="v2.1: true=clear, false=conflict")
    needs_knowledge: Optional[bool] = Field(None, description="v2.1: Whether needs external knowledge")
    should_refuse: bool = Field(False, description="Whether AI should refuse to answer")


class UsageSchema(BaseModel):
    """Token usage information"""
    prompt_tokens: Optional[int] = Field(None, ge=0)
    completion_tokens: Optional[int] = Field(None, ge=0)


class ContentInfoSchema(BaseModel):
    """Content information from AI Core v2.1.0"""
    length: Optional[int] = Field(None, ge=0, description="Character count")
    word_count: Optional[int] = Field(None, ge=0)
    char_count: Optional[int] = Field(None, ge=0, description="Alias for length")
    estimated_read_time: Optional[int] = Field(None, description="Minutes to read")
    has_code_blocks: Optional[bool] = None


class MetadataSchema(BaseModel):
    """AI metadata from AI Core v2.1.0"""
    # v2.1 fields (preferred)
    persona_used: Optional[str] = Field(None, description="v2.1: Full persona description e.g. 'Casual + Cautious'")
    tone: Optional[str] = Field(None, description="v2.0+: casual | technical")
    behavior: Optional[str] = Field(None, description="v2.0+: normal | cautious")
    context_type: Optional[str] = Field(None, description="v2.1: casual | technical")
    needs_knowledge: Optional[bool] = Field(None, description="v2.1: Needs external knowledge")
    signal_strength: Optional[float] = Field(None, description="v2.1: Keyword signal (NOT probability)")
    context_clarity: Optional[bool] = Field(None, description="v2.1: true=clear, false=conflict")
    
    # Content metrics
    length: Optional[int] = Field(None, description="Response length in chars")
    word_count: Optional[int] = Field(None, description="Word count")
    estimated_read_time: Optional[int] = Field(None, description="Minutes to read")
    has_code_blocks: Optional[bool] = Field(None, description="Contains code")
    
    # Legacy/compat fields
    persona: Optional[str] = Field(None, description="Legacy - use persona_used")
    response_mode: Optional[str] = Field(None, description="Deprecated")
    confidence: Optional[float] = Field(None, description="DEPRECATED: Use signal_strength")
    context: Optional[ContextSchema] = Field(None, description="Legacy context object")
    
    # Model info
    model: Optional[str] = Field(None, description="Model name used")
    usage: Optional[UsageSchema] = None
    content_info: Optional[ContentInfoSchema] = Field(None, description="Legacy content metrics")
    valid: bool = Field(True, description="Whether output passed validation")
    warnings: list[str] = Field(default_factory=list, description="Any warnings")

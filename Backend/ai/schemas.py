from typing import Literal

from pydantic import BaseModel, Field, field_validator

IssueType = Literal[
    "pothole", "garbage", "water_leak", "drain_overflow",
    "streetlight", "other", "none",
]
SizeType = Literal["small", "medium", "large", "unknown"]


class VisionResult(BaseModel):
    """Strict shape of what the vision model must return."""

    is_civic_issue: bool
    issue_type: IssueType
    visible_damage: list[str] = Field(default_factory=list)
    hazard_indicators: list[str] = Field(default_factory=list)
    estimated_size: SizeType = "unknown"
    confidence: float = Field(ge=0, le=1)
    summary: str = Field(min_length=1, max_length=300)

    @field_validator("issue_type", "estimated_size", mode="before")
    @classmethod
    def _normalise_text(cls, v):
        # Tolerate "Pothole " or "WATER LEAK" from the model.
        if isinstance(v, str):
            return v.strip().lower().replace(" ", "_").replace("-", "_")
        return v

    @field_validator("confidence", mode="before")
    @classmethod
    def _normalise_confidence(cls, v):
        # Some models answer 85 instead of 0.85.
        if isinstance(v, (int, float)) and 1 < v <= 100:
            return v / 100
        return v

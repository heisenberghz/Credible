"""Request schemas for Credible API."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class AnalysisMode(str, Enum):
    PAGE = "page"
    SELECTION = "selection"


class LinkItem(BaseModel):
    text: str = Field(default="", max_length=500)
    href: str = Field(..., max_length=2048)


class PageData(BaseModel):
    url: str = Field(..., max_length=2048)
    title: Optional[str] = Field(default=None, max_length=1000)
    visible_text: str = Field(default="", max_length=50000)
    links: list[LinkItem] = Field(default_factory=list, max_length=200)


class SelectionData(BaseModel):
    url: str = Field(..., max_length=2048)
    text: str = Field(..., min_length=1, max_length=5000)
    link: Optional[LinkItem] = None


class ClientContext(BaseModel):
    extension_version: Optional[str] = Field(default="0.1.0", max_length=50)
    user_agent: Optional[str] = Field(default=None, max_length=500)


class AnalysisRequest(BaseModel):
    request_id: str = Field(..., min_length=1, max_length=128)
    mode: AnalysisMode
    page: Optional[PageData] = None
    selection: Optional[SelectionData] = None
    client_context: Optional[ClientContext] = None

    @model_validator(mode="after")
    def validate_mode_payload(self) -> "AnalysisRequest":
        if self.mode == AnalysisMode.PAGE:
            if not self.page:
                raise ValueError("The 'page' field is required when mode is 'page'")
            if not self.page.url or not self.page.url.strip():
                raise ValueError("A non-empty 'page.url' is required for page analysis")
        elif self.mode == AnalysisMode.SELECTION:
            if not self.selection:
                raise ValueError("The 'selection' field is required when mode is 'selection'")
            if not self.selection.text or not self.selection.text.strip():
                raise ValueError("A non-empty 'selection.text' is required for selection analysis")
        return self


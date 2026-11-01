"""Input normalization and content bounding service."""

import re
from urllib.parse import urlparse
from typing import Optional, Tuple
from app.core.config import settings
from app.schemas.requests import AnalysisMode, AnalysisRequest, LinkItem, PageData, SelectionData


class NormalizationError(Exception):
    def __init__(self, message: str, code: str = "INVALID_REQUEST", field: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.field = field


def validate_and_normalize_url(raw_url: str, field_name: str = "url") -> str:
    """Validate URL scheme and format, return normalized URL."""
    if not raw_url or not raw_url.strip():
        raise NormalizationError("URL cannot be empty", code="MALFORMED_URL", field=field_name)

    cleaned = raw_url.strip()
    try:
        parsed = urlparse(cleaned)
    except Exception as exc:
        raise NormalizationError(f"Malformed URL: {exc}", code="MALFORMED_URL", field=field_name)

    if parsed.scheme not in ("http", "https"):
        raise NormalizationError(
            f"Unsupported URL scheme '{parsed.scheme}'. Only http and https are supported.",
            code="MALFORMED_URL",
            field=field_name,
        )

    if not parsed.netloc:
        raise NormalizationError(
            "URL is missing a valid network location (hostname).",
            code="MALFORMED_URL",
            field=field_name,
        )

    return cleaned


def clean_text(raw_text: str) -> str:
    """Clean text by removing null bytes, unprintable control characters, and normalizing whitespace."""
    if not raw_text:
        return ""
    # Strip null bytes and non-printable control characters except newline and tab
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", raw_text)
    return cleaned.strip()


def bound_text(text: str, max_chars: int) -> Tuple[str, bool]:
    """Truncate text to max_chars if needed. Return (bounded_text, was_truncated)."""
    cleaned = clean_text(text)
    if len(cleaned) > max_chars:
        return cleaned[:max_chars], True
    return cleaned, False


def normalize_request(request: AnalysisRequest) -> Tuple[AnalysisRequest, list[str]]:
    """
    Normalize all fields in AnalysisRequest.
    Returns (normalized_request, limitations).
    """
    limitations: list[str] = []

    if request.mode == AnalysisMode.PAGE:
        if not request.page:
            raise NormalizationError("Missing page payload in page mode", code="INVALID_REQUEST", field="page")

        norm_url = validate_and_normalize_url(request.page.url, field_name="page.url")
        norm_title = clean_text(request.page.title) if request.page.title else None

        bounded_text, truncated = bound_text(request.page.visible_text, settings.MAX_PAGE_TEXT_CHARS)
        if truncated:
            limitations.append(f"Page text exceeded limit and was bounded to {settings.MAX_PAGE_TEXT_CHARS} characters.")

        normalized_links: list[LinkItem] = []
        for i, link in enumerate(request.page.links[: settings.MAX_LINKS_COUNT]):
            try:
                valid_href = validate_and_normalize_url(link.href, field_name=f"page.links[{i}].href")
                normalized_links.append(
                    LinkItem(
                        text=clean_text(link.text),
                        href=valid_href,
                    )
                )
            except NormalizationError:
                # Ignore invalid links from untrusted page
                continue

        if len(request.page.links) > settings.MAX_LINKS_COUNT:
            limitations.append(f"Page links count exceeded limit and was bounded to {settings.MAX_LINKS_COUNT} links.")

        normalized_page = PageData(
            url=norm_url,
            title=norm_title,
            visible_text=bounded_text,
            links=normalized_links,
        )

        return (
            AnalysisRequest(
                request_id=request.request_id,
                mode=AnalysisMode.PAGE,
                page=normalized_page,
                selection=None,
                client_context=request.client_context,
            ),
            limitations,
        )

    elif request.mode == AnalysisMode.SELECTION:
        if not request.selection:
            raise NormalizationError("Missing selection payload in selection mode", code="INVALID_REQUEST", field="selection")

        norm_url = validate_and_normalize_url(request.selection.url, field_name="selection.url")
        bounded_text, truncated = bound_text(request.selection.text, settings.MAX_SELECTION_TEXT_CHARS)
        if not bounded_text:
            raise NormalizationError("Selection text cannot be empty after normalization", code="INVALID_REQUEST", field="selection.text")
        if truncated:
            limitations.append(f"Selection text exceeded limit and was bounded to {settings.MAX_SELECTION_TEXT_CHARS} characters.")

        norm_link = None
        if request.selection.link:
            try:
                valid_href = validate_and_normalize_url(request.selection.link.href, field_name="selection.link.href")
                norm_link = LinkItem(text=clean_text(request.selection.link.text), href=valid_href)
            except NormalizationError:
                pass

        normalized_selection = SelectionData(
            url=norm_url,
            text=bounded_text,
            link=norm_link,
        )

        return (
            AnalysisRequest(
                request_id=request.request_id,
                mode=AnalysisMode.SELECTION,
                page=None,
                selection=normalized_selection,
                client_context=request.client_context,
            ),
            limitations,
        )

    raise NormalizationError(f"Unsupported analysis mode: {request.mode}", code="UNSUPPORTED_MODE")


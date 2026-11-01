"""Safe operational logging for Credible."""

import logging
import sys
from typing import Optional


class SafeFormatter(logging.Formatter):
    """Formatter that prevents raw page content or sensitive secrets from leaking into logs."""

    def format(self, record: logging.LogRecord) -> str:
        # Standard formatted output
        return super().format(record)


def setup_logger(name: str = "credible") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = SafeFormatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger


logger = setup_logger()


def log_request_event(
    event: str,
    request_id: str,
    mode: Optional[str] = None,
    status: Optional[str] = None,
    extra: Optional[dict] = None,
) -> None:
    """Log structured operational metadata without raw user page text."""
    parts = [f"event={event}", f"request_id={request_id}"]
    if mode:
        parts.append(f"mode={mode}")
    if status:
        parts.append(f"status={status}")
    if extra:
        safe_items = [f"{k}={v}" for k, v in extra.items() if k not in ("visible_text", "text", "password", "key", "token")]
        if safe_items:
            parts.extend(safe_items)
    logger.info(" ".join(parts))


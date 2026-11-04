"""Short-lived in-memory cache for validated AI analysis results.

The cache exists to protect free-tier quota and make rescans of unchanged pages
instant. It stores only validated successes, never failures or unvalidated model
output, and returns deep copies so callers cannot mutate shared state.
"""

from __future__ import annotations

import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Callable, List, Optional, Tuple

from app.services.ai.schemas import AIAnalysisOutput


@dataclass
class _CacheEntry:
    output: AIAnalysisOutput
    limitations: List[str]
    expires_at: float


class AIResultCache:
    """Bounded TTL + LRU cache for ``(AIAnalysisOutput, limitations)`` pairs."""

    def __init__(
        self,
        ttl_seconds: float = 900.0,
        max_entries: int = 128,
        enabled: bool = True,
        clock: Callable[[], float] = time.monotonic,
    ):
        self.ttl_seconds = max(0.0, float(ttl_seconds))
        self.max_entries = max(0, int(max_entries))
        self.enabled = bool(enabled)
        self._clock = clock
        self._entries: "OrderedDict[str, _CacheEntry]" = OrderedDict()
        self.hits = 0
        self.misses = 0

    def _is_expired(self, entry: _CacheEntry, now: float) -> bool:
        return entry.expires_at <= now

    def get(self, key: str) -> Optional[Tuple[AIAnalysisOutput, List[str]]]:
        """Return a deep copy of a non-expired entry, or ``None``."""
        if not self.enabled or not key:
            return None

        now = self._clock()
        entry = self._entries.get(key)
        if entry is None:
            self.misses += 1
            return None

        if self._is_expired(entry, now):
            self._entries.pop(key, None)
            self.misses += 1
            return None

        # Move to the end so the least-recently-used entry is evicted first.
        self._entries.move_to_end(key)
        self.hits += 1
        return entry.output.model_copy(deep=True), list(entry.limitations)

    def set(
        self,
        key: str,
        output: AIAnalysisOutput,
        limitations: List[str],
    ) -> None:
        """Store a validated result. No-op when disabled or capacity is zero."""
        if not self.enabled or not key or self.max_entries == 0:
            return

        now = self._clock()
        self._entries[key] = _CacheEntry(
            output=output.model_copy(deep=True),
            limitations=list(limitations),
            expires_at=now + self.ttl_seconds,
        )
        self._entries.move_to_end(key)

        while len(self._entries) > self.max_entries:
            self._entries.popitem(last=False)

    def clear(self) -> None:
        self._entries.clear()

    def stats(self) -> dict:
        return {
            "enabled": self.enabled,
            "ttl_seconds": self.ttl_seconds,
            "max_entries": self.max_entries,
            "entries": len(self._entries),
            "hits": self.hits,
            "misses": self.misses,
        }

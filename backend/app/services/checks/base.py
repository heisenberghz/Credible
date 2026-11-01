"""Base interface for security threat checks."""

from abc import ABC, abstractmethod
from typing import List
from app.schemas.findings import CheckResult
from app.schemas.requests import AnalysisRequest


class BaseCheck(ABC):
    """Abstract base class for all deterministic checks."""

    check_id: str
    category: str
    description: str

    @abstractmethod
    def run(self, request: AnalysisRequest) -> CheckResult:
        """Execute check against normalized analysis request."""
        pass


class CheckExecutionTracker:
    """Tracks status of all registered checks during an analysis run."""

    def __init__(self, all_check_ids: List[str]):
        self.all_check_ids = list(all_check_ids)
        self.executed: list[str] = []
        self.not_executed: list[str] = []
        self.unavailable: list[str] = []
        self.failed: list[str] = []

    def record_executed(self, check_id: str) -> None:
        if check_id not in self.executed:
            self.executed.append(check_id)

    def record_unavailable(self, check_id: str) -> None:
        if check_id not in self.unavailable:
            self.unavailable.append(check_id)

    def record_failed(self, check_id: str) -> None:
        if check_id not in self.failed:
            self.failed.append(check_id)

    def finalize(self) -> None:
        """Identify any checks that were never executed."""
        accounted = set(self.executed) | set(self.unavailable) | set(self.failed)
        self.not_executed = [cid for cid in self.all_check_ids if cid not in accounted]

    def to_summary(self) -> dict:
        return {
            "executed": self.executed,
            "not_executed": self.not_executed,
            "unavailable": self.unavailable,
            "failed": self.failed,
        }


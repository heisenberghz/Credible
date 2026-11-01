"""Check registry for managing and executing threat detection checks."""

from typing import Dict, List, Optional
from app.schemas.findings import CheckResult
from app.schemas.requests import AnalysisRequest
from app.services.checks.base import BaseCheck, CheckExecutionTracker
from app.services.checks.url_checks import (
    IpHostCheck,
    LookalikeCheck,
    SuspiciousTldCheck,
    UrlLengthCheck,
    UrlObfuscationCheck,
)


class CheckRegistry:
    """Central registry for all deterministic threat checks."""

    def __init__(self):
        self._checks: Dict[str, BaseCheck] = {}
        # Register standard URL checks
        self.register(IpHostCheck())
        self.register(SuspiciousTldCheck())
        self.register(UrlObfuscationCheck())
        self.register(LookalikeCheck())
        self.register(UrlLengthCheck())

    def register(self, check: BaseCheck) -> None:
        self._checks[check.check_id] = check

    def get(self, check_id: str) -> Optional[BaseCheck]:
        return self._checks.get(check_id)

    def list_check_ids(self) -> List[str]:
        return list(self._checks.keys())

    def run_all(self, request: AnalysisRequest) -> tuple[List[CheckResult], CheckExecutionTracker]:
        """Run all registered checks and return (results, tracker)."""
        tracker = CheckExecutionTracker(self.list_check_ids())
        results: List[CheckResult] = []

        for check_id, check in self._checks.items():
            try:
                res = check.run(request)
                results.append(res)
                tracker.record_executed(check_id)
            except Exception:
                tracker.record_failed(check_id)

        tracker.finalize()
        return results, tracker


# Global check registry instance
default_registry = CheckRegistry()


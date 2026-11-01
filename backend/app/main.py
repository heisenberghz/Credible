"""FastAPI main application for Credible."""

import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.analyze import router as analyze_router
from app.api.routes.health import router as health_router
from app.core.config import settings
from app.core.logging import log_request_event, logger
from app.schemas.errors import ErrorCode, ErrorDetail, ErrorResponse


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # Request ID and tracing middleware
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = req_id
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response

    # Exception Handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        req_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        if isinstance(exc.detail, dict):
            code_str = exc.detail.get("code", "INVALID_REQUEST")
            try:
                code = ErrorCode(code_str)
            except ValueError:
                code = ErrorCode.INVALID_REQUEST
            detail = ErrorDetail(
                code=code,
                message=exc.detail.get("message", "Request error"),
                field=exc.detail.get("field"),
            )
        else:
            detail = ErrorDetail(
                code=ErrorCode.INVALID_REQUEST,
                message=str(exc.detail),
            )

        error_response = ErrorResponse(
            error=detail,
            request_id=req_id,
            timestamp=datetime.now(timezone.utc),
        )
        return JSONResponse(status_code=exc.status_code, content=error_response.model_dump(mode="json"))

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        first_err = exc.errors()[0] if exc.errors() else {}
        loc_str = ".".join(str(x) for x in first_err.get("loc", []) if x not in ("body",))

        # Check for payload too large
        msg = first_err.get("msg", "Validation error")
        err_type = first_err.get("type", "").lower()
        code = ErrorCode.INVALID_REQUEST
        if "too_long" in err_type or "max_length" in err_type or "too long" in msg.lower():
            code = ErrorCode.PAYLOAD_TOO_LARGE

        detail = ErrorDetail(
            code=code,
            message=msg,
            field=loc_str if loc_str else None,
        )
        error_response = ErrorResponse(
            error=detail,
            request_id=req_id,
            timestamp=datetime.now(timezone.utc),
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response.model_dump(mode="json"),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        req_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        logger.error(f"Unhandled exception on request {req_id}: {type(exc).__name__}")
        error_response = ErrorResponse(
            error=ErrorDetail(
                code=ErrorCode.INTERNAL_ERROR,
                message="An internal error occurred while processing the request.",
            ),
            request_id=req_id,
            timestamp=datetime.now(timezone.utc),
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response.model_dump(mode="json"),
        )

    # Include routers
    app.include_router(health_router)
    app.include_router(analyze_router)

    return app


app = create_app()


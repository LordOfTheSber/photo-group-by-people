import logging
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from typing import Any, Callable

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_EXECUTOR: ThreadPoolExecutor | None = None
_EXECUTOR_LOCK = Lock()


def _get_executor() -> ThreadPoolExecutor:
    global _EXECUTOR
    if _EXECUTOR is None:
        with _EXECUTOR_LOCK:
            if _EXECUTOR is None:
                settings = get_settings()
                workers = max(1, settings.job_runner_max_workers)
                _EXECUTOR = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="job-runner")
                logger.info("job runner executor started: max_workers=%s", workers)
    return _EXECUTOR


def submit_job(fn: Callable[..., Any], *args: Any) -> None:
    executor = _get_executor()
    executor.submit(fn, *args)


def shutdown_job_runner() -> None:
    global _EXECUTOR
    if _EXECUTOR is not None:
        _EXECUTOR.shutdown(wait=False, cancel_futures=False)
        _EXECUTOR = None

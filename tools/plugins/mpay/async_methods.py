import functools
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable

from pyln.client.plugin import Request


def thread_method(executor: ThreadPoolExecutor) -> Callable[..., Any]:
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(request: Request, *args: list[Any], **kwargs: dict[str, Any]) -> None:
            def run() -> None:
                try:
                    result = func(request, *args, **kwargs)
                    request.set_result(result)
                except Exception as e:
                    request.set_exception(e)

            executor.submit(run)

        return wrapper

    return decorator

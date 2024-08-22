from datetime import datetime, timezone

from pyln.client import Millisatoshi


def time_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def format_error(e: BaseException) -> str:
    return str(e) if str(e) != "" else repr(e)


def fee_with_percent(amount: Millisatoshi, fee: Millisatoshi) -> str:
    return f"{fee} ({round(int(fee) / int(amount) * 100, 4)}%)"

from datetime import datetime, timezone

from pyln.client import Millisatoshi


def time_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def parse_time(time: str) -> int:
    try:
        return int(datetime.strptime(time, "%Y-%m-%dT%H:%M:%S.%f%z").timestamp())
    except ValueError:
        return 0


def format_error(e: BaseException) -> str:
    return str(e) if str(e) != "" else repr(e)


def fee_with_percent(amount: Millisatoshi, fee: Millisatoshi) -> str:
    return f"{fee} ({round(int(fee) / int(amount) * 100, 4)}%)"

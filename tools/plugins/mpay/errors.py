from typing import Any, ClassVar


class Errors:
    no_bolt11: ClassVar[dict[str, Any]] = {
        "code": 4201,
        "message": "no bolt11 specified",
    }
    no_negative_fee: ClassVar[dict[str, Any]] = {
        "code": 4202,
        "message": "negative fees not allowed",
    }
    invalid_bolt11: ClassVar[dict[str, Any]] = {"code": 4203, "message": "invalid bolt11"}

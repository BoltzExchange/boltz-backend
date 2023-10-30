from typing import Any, ClassVar


class Errors:
    invoice_exists: ClassVar[dict[str, Any]] = {
        "code": 2101,
        "message": "hold invoice with that payment hash exists already",
    }
    invoice_not_exists: ClassVar[dict[str, Any]] = {
        "code": 2102,
        "message": "hold invoice with that payment hash does not exist",
    }
    not_route: ClassVar[dict[str, Any]] = {
        "code": 2103,
        "message": "no route found",
    }
    invalid_payment_hash_length: ClassVar[dict[str, Any]] = {
        "code": 2104,
        "message": "invalid payment hash length",
    }

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

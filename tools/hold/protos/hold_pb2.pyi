from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import (
    ClassVar as _ClassVar,
    Iterable as _Iterable,
    Mapping as _Mapping,
    Optional as _Optional,
    Union as _Union,
)

DESCRIPTOR: _descriptor.FileDescriptor

class InvoiceState(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []
    InvoiceUnpaid: _ClassVar[InvoiceState]
    InvoiceAccepted: _ClassVar[InvoiceState]
    InvoicePaid: _ClassVar[InvoiceState]
    InvoiceCancelled: _ClassVar[InvoiceState]

InvoiceUnpaid: InvoiceState
InvoiceAccepted: InvoiceState
InvoicePaid: InvoiceState
InvoiceCancelled: InvoiceState

class InvoiceRequest(_message.Message):
    __slots__ = [
        "payment_hash",
        "amount_msat",
        "description",
        "expiry",
        "min_final_cltv_expiry",
    ]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    AMOUNT_MSAT_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    EXPIRY_FIELD_NUMBER: _ClassVar[int]
    MIN_FINAL_CLTV_EXPIRY_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    amount_msat: int
    description: str
    expiry: int
    min_final_cltv_expiry: int
    def __init__(
        self,
        payment_hash: _Optional[str] = ...,
        amount_msat: _Optional[int] = ...,
        description: _Optional[str] = ...,
        expiry: _Optional[int] = ...,
        min_final_cltv_expiry: _Optional[int] = ...,
    ) -> None: ...

class InvoiceResponse(_message.Message):
    __slots__ = ["bolt11"]
    BOLT11_FIELD_NUMBER: _ClassVar[int]
    bolt11: str
    def __init__(self, bolt11: _Optional[str] = ...) -> None: ...

class SettleRequest(_message.Message):
    __slots__ = ["payment_preimage"]
    PAYMENT_PREIMAGE_FIELD_NUMBER: _ClassVar[int]
    payment_preimage: str
    def __init__(self, payment_preimage: _Optional[str] = ...) -> None: ...

class SettleResponse(_message.Message):
    __slots__ = []
    def __init__(self) -> None: ...

class CancelRequest(_message.Message):
    __slots__ = ["payment_hash"]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    def __init__(self, payment_hash: _Optional[str] = ...) -> None: ...

class CancelResponse(_message.Message):
    __slots__ = []
    def __init__(self) -> None: ...

class ListRequest(_message.Message):
    __slots__ = ["payment_hash"]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    def __init__(self, payment_hash: _Optional[str] = ...) -> None: ...

class Invoice(_message.Message):
    __slots__ = ["payment_hash", "payment_preimage", "state", "bolt11"]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    PAYMENT_PREIMAGE_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    BOLT11_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    payment_preimage: str
    state: InvoiceState
    bolt11: str
    def __init__(
        self,
        payment_hash: _Optional[str] = ...,
        payment_preimage: _Optional[str] = ...,
        state: _Optional[_Union[InvoiceState, str]] = ...,
        bolt11: _Optional[str] = ...,
    ) -> None: ...

class ListResponse(_message.Message):
    __slots__ = ["invoices"]
    INVOICES_FIELD_NUMBER: _ClassVar[int]
    invoices: _containers.RepeatedCompositeFieldContainer[Invoice]
    def __init__(
        self, invoices: _Optional[_Iterable[_Union[Invoice, _Mapping]]] = ...
    ) -> None: ...

class TrackRequest(_message.Message):
    __slots__ = ["payment_hash"]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    def __init__(self, payment_hash: _Optional[str] = ...) -> None: ...

class TrackResponse(_message.Message):
    __slots__ = ["state"]
    STATE_FIELD_NUMBER: _ClassVar[int]
    state: InvoiceState
    def __init__(self, state: _Optional[_Union[InvoiceState, str]] = ...) -> None: ...

class TrackAllRequest(_message.Message):
    __slots__ = []
    def __init__(self) -> None: ...

class TrackAllResponse(_message.Message):
    __slots__ = ["payment_hash", "state"]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    state: InvoiceState
    def __init__(
        self,
        payment_hash: _Optional[str] = ...,
        state: _Optional[_Union[InvoiceState, str]] = ...,
    ) -> None: ...

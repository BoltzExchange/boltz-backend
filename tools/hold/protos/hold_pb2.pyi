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
    INVOICE_UNPAID: _ClassVar[InvoiceState]
    INVOICE_ACCEPTED: _ClassVar[InvoiceState]
    INVOICE_PAID: _ClassVar[InvoiceState]
    INVOICE_CANCELLED: _ClassVar[InvoiceState]

class HtlcState(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []
    HTLC_ACCEPTED: _ClassVar[HtlcState]
    HTLC_SETTLED: _ClassVar[HtlcState]
    HTLC_CANCELLED: _ClassVar[HtlcState]

INVOICE_UNPAID: InvoiceState
INVOICE_ACCEPTED: InvoiceState
INVOICE_PAID: InvoiceState
INVOICE_CANCELLED: InvoiceState
HTLC_ACCEPTED: HtlcState
HTLC_SETTLED: HtlcState
HTLC_CANCELLED: HtlcState

class GetInfoRequest(_message.Message):
    __slots__ = []
    def __init__(self) -> None: ...

class GetInfoResponse(_message.Message):
    __slots__ = ["version"]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    version: str
    def __init__(self, version: _Optional[str] = ...) -> None: ...

class InvoiceRequest(_message.Message):
    __slots__ = [
        "payment_hash",
        "amount_msat",
        "description",
        "expiry",
        "min_final_cltv_expiry",
        "routing_hints",
    ]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    AMOUNT_MSAT_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    EXPIRY_FIELD_NUMBER: _ClassVar[int]
    MIN_FINAL_CLTV_EXPIRY_FIELD_NUMBER: _ClassVar[int]
    ROUTING_HINTS_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    amount_msat: int
    description: str
    expiry: int
    min_final_cltv_expiry: int
    routing_hints: _containers.RepeatedCompositeFieldContainer[RoutingHint]
    def __init__(
        self,
        payment_hash: _Optional[str] = ...,
        amount_msat: _Optional[int] = ...,
        description: _Optional[str] = ...,
        expiry: _Optional[int] = ...,
        min_final_cltv_expiry: _Optional[int] = ...,
        routing_hints: _Optional[_Iterable[_Union[RoutingHint, _Mapping]]] = ...,
    ) -> None: ...

class InvoiceResponse(_message.Message):
    __slots__ = ["bolt11"]
    BOLT11_FIELD_NUMBER: _ClassVar[int]
    bolt11: str
    def __init__(self, bolt11: _Optional[str] = ...) -> None: ...

class RoutingHintsRequest(_message.Message):
    __slots__ = ["node"]
    NODE_FIELD_NUMBER: _ClassVar[int]
    node: str
    def __init__(self, node: _Optional[str] = ...) -> None: ...

class Hop(_message.Message):
    __slots__ = [
        "public_key",
        "short_channel_id",
        "base_fee",
        "ppm_fee",
        "cltv_expiry_delta",
    ]
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    SHORT_CHANNEL_ID_FIELD_NUMBER: _ClassVar[int]
    BASE_FEE_FIELD_NUMBER: _ClassVar[int]
    PPM_FEE_FIELD_NUMBER: _ClassVar[int]
    CLTV_EXPIRY_DELTA_FIELD_NUMBER: _ClassVar[int]
    public_key: str
    short_channel_id: str
    base_fee: int
    ppm_fee: int
    cltv_expiry_delta: int
    def __init__(
        self,
        public_key: _Optional[str] = ...,
        short_channel_id: _Optional[str] = ...,
        base_fee: _Optional[int] = ...,
        ppm_fee: _Optional[int] = ...,
        cltv_expiry_delta: _Optional[int] = ...,
    ) -> None: ...

class RoutingHint(_message.Message):
    __slots__ = ["hops"]
    HOPS_FIELD_NUMBER: _ClassVar[int]
    hops: _containers.RepeatedCompositeFieldContainer[Hop]
    def __init__(
        self, hops: _Optional[_Iterable[_Union[Hop, _Mapping]]] = ...
    ) -> None: ...

class RoutingHintsResponse(_message.Message):
    __slots__ = ["hints"]
    HINTS_FIELD_NUMBER: _ClassVar[int]
    hints: _containers.RepeatedCompositeFieldContainer[RoutingHint]
    def __init__(
        self, hints: _Optional[_Iterable[_Union[RoutingHint, _Mapping]]] = ...
    ) -> None: ...

class ListRequest(_message.Message):
    __slots__ = ["payment_hash"]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    def __init__(self, payment_hash: _Optional[str] = ...) -> None: ...

class Htlc(_message.Message):
    __slots__ = ["state", "msat", "created_at"]
    STATE_FIELD_NUMBER: _ClassVar[int]
    MSAT_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    state: HtlcState
    msat: int
    created_at: int
    def __init__(
        self,
        state: _Optional[_Union[HtlcState, str]] = ...,
        msat: _Optional[int] = ...,
        created_at: _Optional[int] = ...,
    ) -> None: ...

class Invoice(_message.Message):
    __slots__ = [
        "payment_hash",
        "payment_preimage",
        "state",
        "bolt11",
        "created_at",
        "htlcs",
    ]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    PAYMENT_PREIMAGE_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    BOLT11_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    HTLCS_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    payment_preimage: str
    state: InvoiceState
    bolt11: str
    created_at: int
    htlcs: _containers.RepeatedCompositeFieldContainer[Htlc]
    def __init__(
        self,
        payment_hash: _Optional[str] = ...,
        payment_preimage: _Optional[str] = ...,
        state: _Optional[_Union[InvoiceState, str]] = ...,
        bolt11: _Optional[str] = ...,
        created_at: _Optional[int] = ...,
        htlcs: _Optional[_Iterable[_Union[Htlc, _Mapping]]] = ...,
    ) -> None: ...

class ListResponse(_message.Message):
    __slots__ = ["invoices"]
    INVOICES_FIELD_NUMBER: _ClassVar[int]
    invoices: _containers.RepeatedCompositeFieldContainer[Invoice]
    def __init__(
        self, invoices: _Optional[_Iterable[_Union[Invoice, _Mapping]]] = ...
    ) -> None: ...

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
    __slots__ = ["payment_hash", "bolt11", "state"]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    BOLT11_FIELD_NUMBER: _ClassVar[int]
    STATE_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    bolt11: str
    state: InvoiceState
    def __init__(
        self,
        payment_hash: _Optional[str] = ...,
        bolt11: _Optional[str] = ...,
        state: _Optional[_Union[InvoiceState, str]] = ...,
    ) -> None: ...

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

class PayStatusRequest(_message.Message):
    __slots__ = ["bolt11"]
    BOLT11_FIELD_NUMBER: _ClassVar[int]
    bolt11: str
    def __init__(self, bolt11: _Optional[str] = ...) -> None: ...

class PayStatusResponse(_message.Message):
    __slots__ = ["status"]

    class PayStatus(_message.Message):
        __slots__ = ["bolt11", "amount_msat", "destination", "attempts"]

        class Attempt(_message.Message):
            __slots__ = [
                "strategy",
                "start_time",
                "age_in_seconds",
                "end_time",
                "state",
                "success",
                "failure",
            ]

            class AttemptState(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
                __slots__ = []
                ATTEMPT_PENDING: _ClassVar[
                    PayStatusResponse.PayStatus.Attempt.AttemptState
                ]
                ATTEMPT_COMPLETED: _ClassVar[
                    PayStatusResponse.PayStatus.Attempt.AttemptState
                ]
            ATTEMPT_PENDING: PayStatusResponse.PayStatus.Attempt.AttemptState
            ATTEMPT_COMPLETED: PayStatusResponse.PayStatus.Attempt.AttemptState

            class Success(_message.Message):
                __slots__ = ["id", "payment_preimage"]
                ID_FIELD_NUMBER: _ClassVar[int]
                PAYMENT_PREIMAGE_FIELD_NUMBER: _ClassVar[int]
                id: int
                payment_preimage: str
                def __init__(
                    self,
                    id: _Optional[int] = ...,
                    payment_preimage: _Optional[str] = ...,
                ) -> None: ...

            class Failure(_message.Message):
                __slots__ = ["message", "code", "data"]

                class Data(_message.Message):
                    __slots__ = [
                        "id",
                        "raw_message",
                        "fail_code",
                        "fail_codename",
                        "erring_index",
                        "erring_node",
                    ]
                    ID_FIELD_NUMBER: _ClassVar[int]
                    RAW_MESSAGE_FIELD_NUMBER: _ClassVar[int]
                    FAIL_CODE_FIELD_NUMBER: _ClassVar[int]
                    FAIL_CODENAME_FIELD_NUMBER: _ClassVar[int]
                    ERRING_INDEX_FIELD_NUMBER: _ClassVar[int]
                    ERRING_NODE_FIELD_NUMBER: _ClassVar[int]
                    id: int
                    raw_message: str
                    fail_code: int
                    fail_codename: str
                    erring_index: int
                    erring_node: str
                    def __init__(
                        self,
                        id: _Optional[int] = ...,
                        raw_message: _Optional[str] = ...,
                        fail_code: _Optional[int] = ...,
                        fail_codename: _Optional[str] = ...,
                        erring_index: _Optional[int] = ...,
                        erring_node: _Optional[str] = ...,
                    ) -> None: ...
                MESSAGE_FIELD_NUMBER: _ClassVar[int]
                CODE_FIELD_NUMBER: _ClassVar[int]
                DATA_FIELD_NUMBER: _ClassVar[int]
                message: str
                code: int
                data: PayStatusResponse.PayStatus.Attempt.Failure.Data
                def __init__(
                    self,
                    message: _Optional[str] = ...,
                    code: _Optional[int] = ...,
                    data: _Optional[
                        _Union[
                            PayStatusResponse.PayStatus.Attempt.Failure.Data, _Mapping
                        ]
                    ] = ...,
                ) -> None: ...
            STRATEGY_FIELD_NUMBER: _ClassVar[int]
            START_TIME_FIELD_NUMBER: _ClassVar[int]
            AGE_IN_SECONDS_FIELD_NUMBER: _ClassVar[int]
            END_TIME_FIELD_NUMBER: _ClassVar[int]
            STATE_FIELD_NUMBER: _ClassVar[int]
            SUCCESS_FIELD_NUMBER: _ClassVar[int]
            FAILURE_FIELD_NUMBER: _ClassVar[int]
            strategy: str
            start_time: int
            age_in_seconds: int
            end_time: int
            state: PayStatusResponse.PayStatus.Attempt.AttemptState
            success: PayStatusResponse.PayStatus.Attempt.Success
            failure: PayStatusResponse.PayStatus.Attempt.Failure
            def __init__(
                self,
                strategy: _Optional[str] = ...,
                start_time: _Optional[int] = ...,
                age_in_seconds: _Optional[int] = ...,
                end_time: _Optional[int] = ...,
                state: _Optional[
                    _Union[PayStatusResponse.PayStatus.Attempt.AttemptState, str]
                ] = ...,
                success: _Optional[
                    _Union[PayStatusResponse.PayStatus.Attempt.Success, _Mapping]
                ] = ...,
                failure: _Optional[
                    _Union[PayStatusResponse.PayStatus.Attempt.Failure, _Mapping]
                ] = ...,
            ) -> None: ...
        BOLT11_FIELD_NUMBER: _ClassVar[int]
        AMOUNT_MSAT_FIELD_NUMBER: _ClassVar[int]
        DESTINATION_FIELD_NUMBER: _ClassVar[int]
        ATTEMPTS_FIELD_NUMBER: _ClassVar[int]
        bolt11: str
        amount_msat: int
        destination: str
        attempts: _containers.RepeatedCompositeFieldContainer[
            PayStatusResponse.PayStatus.Attempt
        ]
        def __init__(
            self,
            bolt11: _Optional[str] = ...,
            amount_msat: _Optional[int] = ...,
            destination: _Optional[str] = ...,
            attempts: _Optional[
                _Iterable[_Union[PayStatusResponse.PayStatus.Attempt, _Mapping]]
            ] = ...,
        ) -> None: ...
    STATUS_FIELD_NUMBER: _ClassVar[int]
    status: _containers.RepeatedCompositeFieldContainer[PayStatusResponse.PayStatus]
    def __init__(
        self,
        status: _Optional[
            _Iterable[_Union[PayStatusResponse.PayStatus, _Mapping]]
        ] = ...,
    ) -> None: ...

class GetRouteRequest(_message.Message):
    __slots__ = [
        "destination",
        "amount_msat",
        "max_retries",
        "risk_factor",
        "max_cltv",
        "final_cltv_delta",
    ]
    DESTINATION_FIELD_NUMBER: _ClassVar[int]
    AMOUNT_MSAT_FIELD_NUMBER: _ClassVar[int]
    MAX_RETRIES_FIELD_NUMBER: _ClassVar[int]
    RISK_FACTOR_FIELD_NUMBER: _ClassVar[int]
    MAX_CLTV_FIELD_NUMBER: _ClassVar[int]
    FINAL_CLTV_DELTA_FIELD_NUMBER: _ClassVar[int]
    destination: str
    amount_msat: int
    max_retries: int
    risk_factor: int
    max_cltv: int
    final_cltv_delta: int
    def __init__(
        self,
        destination: _Optional[str] = ...,
        amount_msat: _Optional[int] = ...,
        max_retries: _Optional[int] = ...,
        risk_factor: _Optional[int] = ...,
        max_cltv: _Optional[int] = ...,
        final_cltv_delta: _Optional[int] = ...,
    ) -> None: ...

class GetRouteResponse(_message.Message):
    __slots__ = ["hops", "fees_msat"]

    class Hop(_message.Message):
        __slots__ = ["id", "channel", "direction", "amount_msat", "delay", "style"]
        ID_FIELD_NUMBER: _ClassVar[int]
        CHANNEL_FIELD_NUMBER: _ClassVar[int]
        DIRECTION_FIELD_NUMBER: _ClassVar[int]
        AMOUNT_MSAT_FIELD_NUMBER: _ClassVar[int]
        DELAY_FIELD_NUMBER: _ClassVar[int]
        STYLE_FIELD_NUMBER: _ClassVar[int]
        id: str
        channel: str
        direction: int
        amount_msat: int
        delay: int
        style: str
        def __init__(
            self,
            id: _Optional[str] = ...,
            channel: _Optional[str] = ...,
            direction: _Optional[int] = ...,
            amount_msat: _Optional[int] = ...,
            delay: _Optional[int] = ...,
            style: _Optional[str] = ...,
        ) -> None: ...
    HOPS_FIELD_NUMBER: _ClassVar[int]
    FEES_MSAT_FIELD_NUMBER: _ClassVar[int]
    hops: _containers.RepeatedCompositeFieldContainer[GetRouteResponse.Hop]
    fees_msat: int
    def __init__(
        self,
        hops: _Optional[_Iterable[_Union[GetRouteResponse.Hop, _Mapping]]] = ...,
        fees_msat: _Optional[int] = ...,
    ) -> None: ...

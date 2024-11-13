from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class GetInfoRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class GetInfoResponse(_message.Message):
    __slots__ = ("version",)
    VERSION_FIELD_NUMBER: _ClassVar[int]
    version: str
    def __init__(self, version: _Optional[str] = ...) -> None: ...

class GetRoutesRequest(_message.Message):
    __slots__ = ("destination", "min_success", "min_success_ema")
    DESTINATION_FIELD_NUMBER: _ClassVar[int]
    MIN_SUCCESS_FIELD_NUMBER: _ClassVar[int]
    MIN_SUCCESS_EMA_FIELD_NUMBER: _ClassVar[int]
    destination: str
    min_success: float
    min_success_ema: float
    def __init__(self, destination: _Optional[str] = ..., min_success: _Optional[float] = ..., min_success_ema: _Optional[float] = ...) -> None: ...

class GetRoutesResponse(_message.Message):
    __slots__ = ("routes",)
    class Routes(_message.Message):
        __slots__ = ("routes",)
        class Route(_message.Message):
            __slots__ = ("route", "success_rate", "success_rate_ema")
            ROUTE_FIELD_NUMBER: _ClassVar[int]
            SUCCESS_RATE_FIELD_NUMBER: _ClassVar[int]
            SUCCESS_RATE_EMA_FIELD_NUMBER: _ClassVar[int]
            route: _containers.RepeatedScalarFieldContainer[str]
            success_rate: float
            success_rate_ema: float
            def __init__(self, route: _Optional[_Iterable[str]] = ..., success_rate: _Optional[float] = ..., success_rate_ema: _Optional[float] = ...) -> None: ...
        ROUTES_FIELD_NUMBER: _ClassVar[int]
        routes: _containers.RepeatedCompositeFieldContainer[GetRoutesResponse.Routes.Route]
        def __init__(self, routes: _Optional[_Iterable[_Union[GetRoutesResponse.Routes.Route, _Mapping]]] = ...) -> None: ...
    class RoutesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: GetRoutesResponse.Routes
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[GetRoutesResponse.Routes, _Mapping]] = ...) -> None: ...
    ROUTES_FIELD_NUMBER: _ClassVar[int]
    routes: _containers.MessageMap[str, GetRoutesResponse.Routes]
    def __init__(self, routes: _Optional[_Mapping[str, GetRoutesResponse.Routes]] = ...) -> None: ...

class ListPaymentsRequest(_message.Message):
    __slots__ = ("bolt11", "payment_hash", "pagination")
    BOLT11_FIELD_NUMBER: _ClassVar[int]
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    bolt11: str
    payment_hash: str
    pagination: PaginationParams
    def __init__(self, bolt11: _Optional[str] = ..., payment_hash: _Optional[str] = ..., pagination: _Optional[_Union[PaginationParams, _Mapping]] = ...) -> None: ...

class PaginationParams(_message.Message):
    __slots__ = ("offset", "limit")
    OFFSET_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    offset: int
    limit: int
    def __init__(self, offset: _Optional[int] = ..., limit: _Optional[int] = ...) -> None: ...

class ListPaymentsResponse(_message.Message):
    __slots__ = ("payments",)
    class Payment(_message.Message):
        __slots__ = ("id", "destination", "payment_hash", "amount", "ok", "attempts", "created_at")
        class Attempt(_message.Message):
            __slots__ = ("id", "ok", "time", "hops", "created_at")
            class Hop(_message.Message):
                __slots__ = ("id", "node", "channel", "direction", "ok")
                ID_FIELD_NUMBER: _ClassVar[int]
                NODE_FIELD_NUMBER: _ClassVar[int]
                CHANNEL_FIELD_NUMBER: _ClassVar[int]
                DIRECTION_FIELD_NUMBER: _ClassVar[int]
                OK_FIELD_NUMBER: _ClassVar[int]
                id: int
                node: str
                channel: str
                direction: int
                ok: bool
                def __init__(self, id: _Optional[int] = ..., node: _Optional[str] = ..., channel: _Optional[str] = ..., direction: _Optional[int] = ..., ok: bool = ...) -> None: ...
            ID_FIELD_NUMBER: _ClassVar[int]
            OK_FIELD_NUMBER: _ClassVar[int]
            TIME_FIELD_NUMBER: _ClassVar[int]
            HOPS_FIELD_NUMBER: _ClassVar[int]
            CREATED_AT_FIELD_NUMBER: _ClassVar[int]
            id: int
            ok: bool
            time: int
            hops: _containers.RepeatedCompositeFieldContainer[ListPaymentsResponse.Payment.Attempt.Hop]
            created_at: int
            def __init__(self, id: _Optional[int] = ..., ok: bool = ..., time: _Optional[int] = ..., hops: _Optional[_Iterable[_Union[ListPaymentsResponse.Payment.Attempt.Hop, _Mapping]]] = ..., created_at: _Optional[int] = ...) -> None: ...
        ID_FIELD_NUMBER: _ClassVar[int]
        DESTINATION_FIELD_NUMBER: _ClassVar[int]
        PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
        AMOUNT_FIELD_NUMBER: _ClassVar[int]
        OK_FIELD_NUMBER: _ClassVar[int]
        ATTEMPTS_FIELD_NUMBER: _ClassVar[int]
        CREATED_AT_FIELD_NUMBER: _ClassVar[int]
        id: int
        destination: str
        payment_hash: str
        amount: int
        ok: bool
        attempts: _containers.RepeatedCompositeFieldContainer[ListPaymentsResponse.Payment.Attempt]
        created_at: int
        def __init__(self, id: _Optional[int] = ..., destination: _Optional[str] = ..., payment_hash: _Optional[str] = ..., amount: _Optional[int] = ..., ok: bool = ..., attempts: _Optional[_Iterable[_Union[ListPaymentsResponse.Payment.Attempt, _Mapping]]] = ..., created_at: _Optional[int] = ...) -> None: ...
    PAYMENTS_FIELD_NUMBER: _ClassVar[int]
    payments: _containers.RepeatedCompositeFieldContainer[ListPaymentsResponse.Payment]
    def __init__(self, payments: _Optional[_Iterable[_Union[ListPaymentsResponse.Payment, _Mapping]]] = ...) -> None: ...

class PayRequest(_message.Message):
    __slots__ = ("bolt11", "max_fee_msat", "exempt_fee_msat", "timeout", "max_delay")
    BOLT11_FIELD_NUMBER: _ClassVar[int]
    MAX_FEE_MSAT_FIELD_NUMBER: _ClassVar[int]
    EXEMPT_FEE_MSAT_FIELD_NUMBER: _ClassVar[int]
    TIMEOUT_FIELD_NUMBER: _ClassVar[int]
    MAX_DELAY_FIELD_NUMBER: _ClassVar[int]
    bolt11: str
    max_fee_msat: int
    exempt_fee_msat: int
    timeout: int
    max_delay: int
    def __init__(self, bolt11: _Optional[str] = ..., max_fee_msat: _Optional[int] = ..., exempt_fee_msat: _Optional[int] = ..., timeout: _Optional[int] = ..., max_delay: _Optional[int] = ...) -> None: ...

class PayResponse(_message.Message):
    __slots__ = ("payment_hash", "payment_preimage", "fee_msat", "time", "destination", "amount_msat", "amount_sent_msat", "parts", "status", "created_at")
    PAYMENT_HASH_FIELD_NUMBER: _ClassVar[int]
    PAYMENT_PREIMAGE_FIELD_NUMBER: _ClassVar[int]
    FEE_MSAT_FIELD_NUMBER: _ClassVar[int]
    TIME_FIELD_NUMBER: _ClassVar[int]
    DESTINATION_FIELD_NUMBER: _ClassVar[int]
    AMOUNT_MSAT_FIELD_NUMBER: _ClassVar[int]
    AMOUNT_SENT_MSAT_FIELD_NUMBER: _ClassVar[int]
    PARTS_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    payment_hash: str
    payment_preimage: str
    fee_msat: int
    time: int
    destination: str
    amount_msat: int
    amount_sent_msat: int
    parts: int
    status: str
    created_at: int
    def __init__(self, payment_hash: _Optional[str] = ..., payment_preimage: _Optional[str] = ..., fee_msat: _Optional[int] = ..., time: _Optional[int] = ..., destination: _Optional[str] = ..., amount_msat: _Optional[int] = ..., amount_sent_msat: _Optional[int] = ..., parts: _Optional[int] = ..., status: _Optional[str] = ..., created_at: _Optional[int] = ...) -> None: ...

class ResetPathMemoryRequest(_message.Message):
    __slots__ = ("exclude_permanent_memory", "exclude_temporary_memory")
    EXCLUDE_PERMANENT_MEMORY_FIELD_NUMBER: _ClassVar[int]
    EXCLUDE_TEMPORARY_MEMORY_FIELD_NUMBER: _ClassVar[int]
    exclude_permanent_memory: bool
    exclude_temporary_memory: bool
    def __init__(self, exclude_permanent_memory: bool = ..., exclude_temporary_memory: bool = ...) -> None: ...

class ResetPathMemoryResponse(_message.Message):
    __slots__ = ("payments", "attempts", "hops")
    PAYMENTS_FIELD_NUMBER: _ClassVar[int]
    ATTEMPTS_FIELD_NUMBER: _ClassVar[int]
    HOPS_FIELD_NUMBER: _ClassVar[int]
    payments: int
    attempts: int
    hops: int
    def __init__(self, payments: _Optional[int] = ..., attempts: _Optional[int] = ..., hops: _Optional[int] = ...) -> None: ...

class PayStatusRequest(_message.Message):
    __slots__ = ("invoice",)
    INVOICE_FIELD_NUMBER: _ClassVar[int]
    invoice: str
    def __init__(self, invoice: _Optional[str] = ...) -> None: ...

class PayStatusResponse(_message.Message):
    __slots__ = ("status",)
    class PayStatus(_message.Message):
        __slots__ = ("bolt11", "bolt12", "amount_msat", "destination", "attempts")
        class Attempt(_message.Message):
            __slots__ = ("strategy", "start_time", "age_in_seconds", "end_time", "state", "success", "failure")
            class AttemptState(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
                __slots__ = ()
                ATTEMPT_PENDING: _ClassVar[PayStatusResponse.PayStatus.Attempt.AttemptState]
                ATTEMPT_COMPLETED: _ClassVar[PayStatusResponse.PayStatus.Attempt.AttemptState]
            ATTEMPT_PENDING: PayStatusResponse.PayStatus.Attempt.AttemptState
            ATTEMPT_COMPLETED: PayStatusResponse.PayStatus.Attempt.AttemptState
            class Success(_message.Message):
                __slots__ = ("id", "payment_preimage")
                ID_FIELD_NUMBER: _ClassVar[int]
                PAYMENT_PREIMAGE_FIELD_NUMBER: _ClassVar[int]
                id: int
                payment_preimage: str
                def __init__(self, id: _Optional[int] = ..., payment_preimage: _Optional[str] = ...) -> None: ...
            class Failure(_message.Message):
                __slots__ = ("message", "code", "data")
                class Data(_message.Message):
                    __slots__ = ("id", "raw_message", "fail_code", "fail_codename", "erring_index", "erring_node")
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
                    def __init__(self, id: _Optional[int] = ..., raw_message: _Optional[str] = ..., fail_code: _Optional[int] = ..., fail_codename: _Optional[str] = ..., erring_index: _Optional[int] = ..., erring_node: _Optional[str] = ...) -> None: ...
                MESSAGE_FIELD_NUMBER: _ClassVar[int]
                CODE_FIELD_NUMBER: _ClassVar[int]
                DATA_FIELD_NUMBER: _ClassVar[int]
                message: str
                code: int
                data: PayStatusResponse.PayStatus.Attempt.Failure.Data
                def __init__(self, message: _Optional[str] = ..., code: _Optional[int] = ..., data: _Optional[_Union[PayStatusResponse.PayStatus.Attempt.Failure.Data, _Mapping]] = ...) -> None: ...
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
            def __init__(self, strategy: _Optional[str] = ..., start_time: _Optional[int] = ..., age_in_seconds: _Optional[int] = ..., end_time: _Optional[int] = ..., state: _Optional[_Union[PayStatusResponse.PayStatus.Attempt.AttemptState, str]] = ..., success: _Optional[_Union[PayStatusResponse.PayStatus.Attempt.Success, _Mapping]] = ..., failure: _Optional[_Union[PayStatusResponse.PayStatus.Attempt.Failure, _Mapping]] = ...) -> None: ...
        BOLT11_FIELD_NUMBER: _ClassVar[int]
        BOLT12_FIELD_NUMBER: _ClassVar[int]
        AMOUNT_MSAT_FIELD_NUMBER: _ClassVar[int]
        DESTINATION_FIELD_NUMBER: _ClassVar[int]
        ATTEMPTS_FIELD_NUMBER: _ClassVar[int]
        bolt11: str
        bolt12: str
        amount_msat: int
        destination: str
        attempts: _containers.RepeatedCompositeFieldContainer[PayStatusResponse.PayStatus.Attempt]
        def __init__(self, bolt11: _Optional[str] = ..., bolt12: _Optional[str] = ..., amount_msat: _Optional[int] = ..., destination: _Optional[str] = ..., attempts: _Optional[_Iterable[_Union[PayStatusResponse.PayStatus.Attempt, _Mapping]]] = ...) -> None: ...
    STATUS_FIELD_NUMBER: _ClassVar[int]
    status: _containers.RepeatedCompositeFieldContainer[PayStatusResponse.PayStatus]
    def __init__(self, status: _Optional[_Iterable[_Union[PayStatusResponse.PayStatus, _Mapping]]] = ...) -> None: ...

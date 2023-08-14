import random
from enum import Enum

from bolt11 import Bolt11, Feature, Features, FeatureState, encode
from bolt11.types import MilliSatoshi, RouteHint, Tag, TagChar, Tags
from consts import Network
from pyln.client import Plugin
from secp256k1 import PrivateKey
from utils import time_now

NETWORK_PREFIXES = {
    Network.Mainnet: "bc",
    Network.Testnet: "tb",
    Network.Signet: "tbs",
    Network.Regtest: "bcrt",
}


class Defaults(int, Enum):
    Expiry = 3600
    MinFinalCltvExpiry = 80


def get_network_prefix(network: str) -> str:
    # noinspection PyTypeChecker
    return (
        NETWORK_PREFIXES[network]
        if network in NETWORK_PREFIXES
        else NETWORK_PREFIXES[Network.Mainnet]
    )


def get_payment_secret(val: str | None) -> str:
    return val if val is not None else random.randbytes(32).hex()


class Encoder:
    _pl: Plugin
    _prefix: str
    _features: Features

    # Random key to make the bolt11 library work;
    # the node signs the invoice again with its key
    _key = PrivateKey().serialize()

    def __init__(self, pl: Plugin) -> None:
        self._pl = pl

    def init(self) -> None:
        info = self._pl.rpc.getinfo()
        self._prefix = get_network_prefix(info["network"])

        # TODO: parse from CLN
        self._features = Features.from_feature_list(
            {
                Feature.var_onion_optin: FeatureState.required,
                Feature.payment_secret: FeatureState.required,
                Feature.basic_mpp: FeatureState.supported,
                Feature.option_route_blinding: FeatureState.supported,
            }
        )

    def encode(
        self,
        payment_hash: str,
        amount_msat: int,
        description: str = "",
        expiry: int = Defaults.Expiry,
        min_final_cltv_expiry: int = Defaults.MinFinalCltvExpiry,
        payment_secret: str | None = None,
        route_hints: list[RouteHint] | None = None,
    ) -> str:
        tags = Tags(
            [
                Tag(TagChar.payment_hash, payment_hash),
                Tag(TagChar.description, description),
                Tag(TagChar.expire_time, expiry),
                Tag(TagChar.min_final_cltv_expiry, min_final_cltv_expiry),
                Tag(TagChar.payment_secret, get_payment_secret(payment_secret)),
                Tag(TagChar.features, self._features),
            ]
        )

        if route_hints is not None:
            tags.tags.extend([Tag(TagChar.route_hint, route) for route in route_hints])

        return encode(
            Bolt11(
                self._prefix,
                int(time_now().timestamp()),
                tags,
                MilliSatoshi(amount_msat),
            ),
            self._key,
        )

#!/usr/bin/env python3
"""Calculate the miner fee of a transaction."""
from argparse import ArgumentParser
from dataclasses import dataclass
from pathlib import Path

from bitcoinrpc.authproxy import AuthServiceProxy

SAT_FACTOR = 10**8


@dataclass
class MinerFee:
    total: float
    per_vbyte: int


def get_rpc_connection(rpc_port: int, cookie_file: str) -> AuthServiceProxy:
    """Initialize the RPC connection to the daemon."""
    cookie_path = Path(__file__).parent.joinpath(Path(cookie_file))

    with cookie_path.open() as cookie:
        cookie_parts = cookie.read().split(":")
        return AuthServiceProxy(
            "http://{}:{}@127.0.0.1:{}".format(
                cookie_parts[0],
                cookie_parts[1],
                rpc_port,
            )
        )


def get_raw_transaction(rpc_connection: AuthServiceProxy, transaction_id: str) -> any:
    """Query a raw transaction verbosely."""
    return rpc_connection.getrawtransaction(transaction_id, 1)


def calculate_miner_fee(
    rpc_connection: AuthServiceProxy,
    transaction_id: str,
) -> MinerFee:
    """Calcalute the miner fee of a transaction."""
    miner_fee = 0
    raw_transaction = get_raw_transaction(rpc_connection, transaction_id)

    for tx_input in raw_transaction["vin"]:
        input_transaction = get_raw_transaction(rpc_connection, tx_input["txid"])
        miner_fee += input_transaction["vout"][tx_input["vout"]]["value"]

    for output in raw_transaction["vout"]:
        miner_fee -= output["value"]

    return MinerFee(miner_fee, (miner_fee * SAT_FACTOR) / raw_transaction["vsize"])


if __name__ == "__main__":
    PARSER = ArgumentParser(description="Calculate the miner fee of a transaction")

    # CLI arguments
    PARSER.add_argument(
        "transaction",
        help="Transaction of which the miner fee should be calculated",
        type=str,
    )

    PARSER.add_argument(
        "rpcport",
        help="RPC port of the Bitcoin or Litecoin Core daemon",
        type=int,
        nargs="?",
        default=18443,
    )
    PARSER.add_argument(
        "cookie_file",
        help="Cookie file of the Bitcoin or Litecoin Core daemon",
        type=str,
        nargs="?",
        default="../docker/regtest/data/core/cookies/.bitcoin-cookie",
    )

    ARGS = PARSER.parse_args()

    RPC_CONNECTION = get_rpc_connection(ARGS.rpcport, ARGS.cookie_file)

    fee = calculate_miner_fee(RPC_CONNECTION, ARGS.transaction)
    print("Total:", fee.total)
    print("Total sats:", int(fee.total * SAT_FACTOR))
    print(f"sat/vbyte: {fee.per_vbyte:.2f}")

#!/usr/bin/env python3
"""Calculate the miner fee of a transaction"""
from argparse import ArgumentParser
from bitcoinrpc.authproxy import AuthServiceProxy

def get_rpc_connection(rpc_port: int):
    """Initialize the RPC connection to the daemon"""
    return AuthServiceProxy("http://kek:kek@127.0.0.1:{}".format(rpc_port))

def get_raw_transaction(rpc_connection: AuthServiceProxy, transaction_id: str):
    """Query a raw transaction verbosely"""
    return rpc_connection.getrawtransaction(transaction_id, 1)

def calculate_miner_fee(rpc_connection: AuthServiceProxy, transaction_id: str):
    """Calcalute the miner fee of a transaction"""
    miner_fee = 0
    raw_transaction = get_raw_transaction(rpc_connection, transaction_id)

    for tx_input in raw_transaction["vin"]:
        input_transaction = get_raw_transaction(rpc_connection, tx_input["txid"])
        miner_fee += input_transaction["vout"][tx_input["vout"]]["value"]

    for output in raw_transaction["vout"]:
        miner_fee -= output["value"]

    return miner_fee

if __name__ == "__main__":
    PARSER = ArgumentParser(description="Calculate the miner fee of a transaction")

    # CLI arguments
    PARSER.add_argument("rpcport", help="RPC port of the Bitcoin or Litecoin Core daemon", type=int)
    PARSER.add_argument(
        "transaction",
        help="Transaction of which the miner fee should be calculated",
        type=str,
    )

    ARGS = PARSER.parse_args()

    RPC_CONNECTION = get_rpc_connection(ARGS.rpcport)

    print(calculate_miner_fee(RPC_CONNECTION, ARGS.transaction))

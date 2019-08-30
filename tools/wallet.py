#!/usr/bin/env python3
"""Sends a specified amount of onchain coins to the wallet of Boltz"""
import json
import subprocess
from typing import List
from dataclasses import dataclass
from argparse import ArgumentParser

@dataclass
class Chain:
    """Chain on which coins can be sent"""

    symbol: str
    executable: str

    aliases: List[str]

CHAINS: List[Chain] = [
    Chain(
        symbol="BTC",
        executable="bitcoin-cli --regtest --rpcuser=kek --rpcpassword=kek",
        aliases=[
            "bitcoin",
            "btc"
        ]
    ),
    Chain(
        symbol="LTC",
        executable="litecoin-cli --regtest --rpcuser=kek --rpcpassword=kek",
        aliases=[
            "litecoin",
            "ltc"
        ]
    )
]

def execute_command(command: str) -> str:
    """Executes a command in the shell"""
    response = subprocess.check_output(command, shell=True)

    return response.decode("UTF-8").rstrip()

def send_coins(amount: float, chains: List[Chain]):
    """Sends coins to the boltz wallet on all specified chains"""

    for chain in chains:
        boltz_response = execute_command("boltz-cli newaddress {} bech32".format(chain.symbol))
        boltz_address = json.loads(boltz_response)["address"]

        executable_response = execute_command(
            "{executable} sendtoaddress {address} {amount}".format(
                executable=chain.executable,
                address=boltz_address,
                amount=amount
            )
        )

        execute_command("{} generate 1".format(chain.executable))

        print("{symbol} transaction id: {id}".format(
            symbol=chain.symbol,
            id=executable_response
        ))

def parse_chains(to_parse: List[str]) -> List[Chain]:
    """Returns specified chains or all available if none were set"""

    if not to_parse:
        return CHAINS

    to_return: List[Chain] = []

    for argument in to_parse:
        for chain in CHAINS:
            if argument.lower() in chain.aliases:
                to_return.append(chain)

    return to_return

if __name__ == "__main__":
    PARSER = ArgumentParser(description="Send coins to wallet of Boltz")

    # CLI arguments
    PARSER.add_argument("amount", type=float, default=10, nargs="?")
    PARSER.add_argument("chains", type=str, default="", nargs="*")

    ARGS = PARSER.parse_args()

    PARSED_CHAINS = parse_chains(ARGS.chains)

    send_coins(ARGS.amount, PARSED_CHAINS)

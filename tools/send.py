#!/usr/bin/env python3
"""Sends Ether or ERC20 tokens"""
import os
import json
from math import pow
from hexbytes import HexBytes
from argparse import ArgumentParser
from web3.auto import w3

def send_ether(amount: float, destination: str):
    return w3.eth.sendTransaction({
        "from": w3.eth.accounts[0],
        "value": w3.toWei(amount, "ether"),
        "to": w3.toChecksumAddress(destination)
    })

def send_erc20(amount: float, destination: str, contract_address: str):
    ABI_PATH = os.path.join(os.path.dirname(__file__), "..", "node_modules/boltz-core/build/contracts/IERC20.json")
    ABI = open(ABI_PATH, "r")

    CONTRACT = w3.eth.contract(address=contract_address, abi=json.load(ABI)["abi"])
    TOKENS = int(amount * pow(10, 18))

    TRANSACTION_DATA = CONTRACT.functions.transfer(w3.toChecksumAddress(destination), TOKENS).buildTransaction({
        'chainId': w3.eth.chainId,
        'nonce': w3.eth.getTransactionCount("0xA7430D5ef25467365112C21A0e803cc72905cC50"),
    })
    TRANSACTION = w3.eth.account.signTransaction(TRANSACTION_DATA, "c62d626999898ce6b5e4cb7122d7f9ffa3c08dda6d1b2b35ec3a4e0b9ebfd5dc")

    return w3.eth.sendRawTransaction(TRANSACTION.rawTransaction)

def log_sent(symbol: str, amount: float, transaction_hash: str):
    print("Sent {amount} {symbol}: {hash}".format(
        symbol=symbol,
        amount=amount,
        hash=HexBytes(transaction_hash).hex(),
    ))

if __name__ == "__main__":
    PARSER = ArgumentParser(description="Send Ether or ERC20 tokens")

    # CLI arguments
    PARSER.add_argument("amount", help="Number of tokens to send", type=float)

    # TODO: get default address from boltz-cli
    PARSER.add_argument("destination", help="Address to which the coins should be sent", type=str)
    PARSER.add_argument("contract", help="Address of the ERC20 contract", type=str, nargs="?")

    ARGS = PARSER.parse_args()

    if ARGS.contract == None or ARGS.contract == "":
        TRANSACTION_HASH = send_ether(ARGS.amount, ARGS.destination)
        log_sent("Ether", ARGS.amount, TRANSACTION_HASH)
    else:
        TRANSACTION_HASH = send_erc20(ARGS.amount, ARGS.destination, ARGS.contract)
        log_sent("ERC20", ARGS.amount, TRANSACTION_HASH)

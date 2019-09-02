#!/usr/bin/env python3
"""Generates OTP tokens"""
from argparse import ArgumentParser
import pyotp

if __name__ == "__main__":
    PARSER = ArgumentParser(description="Generate OTP tokens")

    # CLI arguments
    PARSER.add_argument(
        "secret",
        help="Secret from which the token will be generated",
        type=str,
        nargs=1,
    )

    ARGS = PARSER.parse_args()

    TOTP = pyotp.TOTP(ARGS.secret[0])
    print("Token: {}".format(TOTP.now()))

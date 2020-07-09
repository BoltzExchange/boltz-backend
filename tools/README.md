# Boltz tools

This scripts were written and are used with `Python 3.7.3` or higher. Older versions *might* work too but I wouldn't rely on that.

Unlike the `docker/build.py` script these ones have dependencies that have to be installed. To do that a virtual environment has to be created with:

```bash
virtualenv .venv
source .venv/bin/activate
```

To install the required dependencies:

```bash
npm run python:install
```

## Streaming Server-Sent Events

Streaming Server-Sent Events is a little tedious to do in the browser and there are hardly any tools available for it. To make this a little more convenient there is the `sse.py` script that allows for stream Server-Sent Events via the CLI:

```bash
./sse.py <URL of the SSE>
```

## Generating OTP tokens

To generate OTP tokens for the `withdraw` Discord command without having to setup an app the script `otp.py` can be used:

```bash
./otp.py <OTP seed>
```

## Calculating the miner fee of transactions

To calculate the miner fee of a transaction `miner_fee.py` can be used:

```bash
./miner_fee.py <rpcport> <transaction>
```

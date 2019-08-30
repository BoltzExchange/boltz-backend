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

## Funding the Boltz wallet

When starting the Boltz regtest image everything is setup and funded apart from the Boltz wallet. To fix that with a single command there is this Python script:

```bash
./wallet.py <amount of coins to send> [chains]
```

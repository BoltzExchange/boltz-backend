---
description: >-
  This page goes over the Boltz API v2
---

# 🤖 REST API v2

## REST endpoints

The Swagger specifications of the Boltz REST API can be found [here](https://api.boltz.exchange/swagger).

## WebSocket

Instead of polling for Swap status updates, clients can subscribe to them with a Websocket.
The endpoints are available at:

- Testnet: `wss://api.testnet.boltz.exchange/v2/ws`
- Mainnet: `wss://api.boltz.exchange/v2/ws`

To subscribe to Swap status updates send a message below.
`args` is a list of the Swap ids to subscribe to.

```json
{
  "op": "subscribe",
  "channel": "swap.update",
  "args": [
    "swap id 1",
    "swap id 2"
  ]
}
```

The backend will respond with a message like this to confirm that the subscription was created successfully:

```json
{
  "event": "subscribe",
  "channel": "swap.update",
  "args": [
    "swap id 1",
    "swap id 2"
  ]
}
```

After that initial subscription confirmation message and whenever a Swap status is updated, Boltz will send a message like this:

```json
{
  "event": "update",
  "channel": "swap.update",
  "args": [
    {
      "id": "swap id 1",
      "status": "invoice.set"
    }
  ]
}
```

The `args` are a list of objects. Those objects are like the responses of `GET /swap/{id}` but also include the id of the Swap.
---
description: Get notified about swap status updates
---

# 🪝 Webhooks

To get the latest status of your swaps, you can poll the status endpoints of the REST API, subscribe to the WebSocket, or set a webhook when creating the swap.

To register a webhook, add the following object to the request that creates the swap:

```json
{
  ...
  "webhook": {
    "url": "<URL that should called>",
    "hashSwapId": false,
    "status": ["invoice.pending", "transaction.claim.pending"]
  }
}
```

`url` will be called on every swap status update with a JSON object structured like this:

```json
{
  "event": "swap.update",
  "data": {
    "id": "<swap id>",
    "status": "<new status of the swap>"
  }
}
```

Only HTTPS URLs are allowed for webhooks. `hashSwapId` is optional and defaults to false. When it is explicitly set to `true`, the swap id is hashed with SHA256 and encoded as HEX in the webhook call. That is useful when the webhook is processed by a third party to which you do not want to leak information about your swaps.

`status` is optional and is a list of swap status update events for which the webhook should be called. If not set, the webhook will be called for all events.

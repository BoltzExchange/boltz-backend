# ⚠️ Common Mistakes

This document collects frequently encountered misunderstandings and common
mistakes when integrating Boltz API.

## Permanently Store Swap Information

It is essential to safely store swap information like claim and refund keys along with all other swap data in order to successfully pick up pending swaps or refund in case a submarine or chain swap fails. Permanently storing historical swap data is useful to e.g. provide the user with a proof of payment with a Lightning invoice and its corresponding preimage of a submarine swap.

## Client-Side

All Boltz API integrations should be client-side, meaning in end-user-controlled software on end-user-controlled devices. Boltz's non-custodial nature can only be maintained if the end user is in full control of Boltz Swaps. This concretely means that integrations should never run Boltz API clients on behalf of end users or store refund/swap information on their servers. The best way to get the broader Bitcoin community to accept and use a Boltz Swap Client is for the code to be open source and reviewed by the Boltz Team.

## Online Requirement

It is important to design Boltz API clients, especially on mobile, in a way that they can come online and broadcast claim transactions before a swap expires. We added [WebHook calls](https://github.com/BoltzExchange/boltz-backend/issues/605) informing about swap updates that developers can use to wake up clients with push notifications.

## Retry Mechanism

API clients should account for temporary network failures and, e.g., retry claiming swaps or sending payments. On mobile, claim logic should be triggered on app start and work independently of which part of the app the user navigates to. This also goes for WebView integrations of our [Web App](https://github.com/BoltzExchange/boltz-web-app).

## Lockup Transaction Handling

API clients must ensure to fund Boltz swaps via a single lockup transaction. If multiple transactions fund the same lockup address, only the first is used for the swap; others are ignored. The swap will fail if this first transaction's amount is insufficient. Following a swap failure, Boltz facilitates cooperative refunds for all outputs sent to the address.

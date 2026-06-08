ALTER TABLE "payjoinReceiverSessions"
ADD COLUMN "payjoinTxId" TEXT;

CREATE INDEX "payjoinReceiverSessions_payjoinTxId_idx" ON "payjoinReceiverSessions" ("payjoinTxId")
WHERE
  "payjoinTxId" IS NOT NULL;

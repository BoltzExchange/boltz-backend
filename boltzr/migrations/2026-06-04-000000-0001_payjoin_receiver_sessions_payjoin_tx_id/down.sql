DROP INDEX "payjoinReceiverSessions_payjoinTxId_idx";

ALTER TABLE "payjoinReceiverSessions"
DROP COLUMN "payjoinTxId";

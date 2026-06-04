DROP INDEX "payjoinReceiverSessions_swapId_completedAt_idx";
DROP INDEX "payjoinReceiverSessions_swapId_unique_idx";

ALTER TABLE "payjoinReceiverSessions"
    DROP COLUMN "swapId";

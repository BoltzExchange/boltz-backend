ALTER TABLE "payjoinReceiverSessions"
    ADD COLUMN "swapId" TEXT;

CREATE UNIQUE INDEX "payjoinReceiverSessions_swapId_unique_idx"
    ON "payjoinReceiverSessions" ("swapId")
    WHERE "swapId" IS NOT NULL;

CREATE INDEX "payjoinReceiverSessions_swapId_completedAt_idx"
    ON "payjoinReceiverSessions" ("swapId", "completedAt")
    WHERE "swapId" IS NOT NULL;

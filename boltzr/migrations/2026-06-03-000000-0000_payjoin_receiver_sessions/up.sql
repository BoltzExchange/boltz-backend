CREATE TABLE "payjoinReceiverSessions" (
    id BIGSERIAL PRIMARY KEY,
    address TEXT NOT NULL,
    "amountSats" BIGINT,
    label TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMPTZ
);

CREATE TABLE "payjoinReceiverSessionEvents" (
    id BIGSERIAL PRIMARY KEY,
    "sessionId" BIGINT NOT NULL REFERENCES "payjoinReceiverSessions"(id) ON DELETE CASCADE,
    "eventData" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "payjoinReceiverSessionEvents_sessionId_id_idx"
    ON "payjoinReceiverSessionEvents" ("sessionId", id);

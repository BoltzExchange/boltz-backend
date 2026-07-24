CREATE TABLE "payjoinReceiverSeenInputs" (
  outpoint TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

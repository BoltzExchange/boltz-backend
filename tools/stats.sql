-- Stats

CREATE VIEW swap_volume AS
SELECT
    strftime('%Y', createdAt) AS year,
    strftime('%m', createdAt) AS month,
    pair,
    count(*) AS trades,
    sum(expectedAmount) / power(10, 8) AS volume
FROM swaps
WHERE status = 'transaction.claimed'
GROUP BY year, month, pair;

CREATE VIEW reverse_volume AS
SELECT
    strftime('%Y', createdAt) AS year,
    strftime('%m', createdAt) AS month,
    pair,
    count(*) AS trades,
    sum(onchainAmount) / power(10, 8) AS volume
FROM reverseSwaps
WHERE status = 'invoice.settled'
GROUP BY year, month, pair;

WITH dat AS (
    SELECT * FROM swap_volume
    UNION
    SELECT * FROM reverse_volume
)
SELECT
    year,
    month,
    pair,
    sum(trades) AS trades,
    round(sum(volume), 8) AS volume
FROM dat
GROUP BY year, month, pair;

-- Referrals

CREATE VIEW swap_referrals AS
SELECT
    strftime('%Y', swaps.createdAt) AS year,
    strftime('%m', swaps.createdAt) AS month,
    pair,
    referrals.id,
    count(*) AS trades,
    sum(expectedAmount) / power(10, 8) AS volume,
    sum((swaps.fee * referrals.feeShare) / 100) AS referralSum
FROM referrals
    INNER JOIN swaps ON referrals.id = swaps.referral
WHERE status = 'transaction.claimed'
GROUP BY year, month, pair, referrals.id;

CREATE VIEW reverse_referrals AS
SELECT
    strftime('%Y', reverseSwaps.createdAt) AS year,
    strftime('%m', reverseSwaps.createdAt) AS month,
    pair,
    referrals.id,
    count(*) AS trades,
    sum(onchainAmount) / power(10, 8) AS volume,
    sum((reverseSwaps.fee * referrals.feeShare) / 100) AS referralSum
FROM referrals
    INNER JOIN reverseSwaps ON referrals.id = reverseSwaps.referral
WHERE status = 'invoice.settled'
GROUP BY year, month, pair, referrals.id;

WITH dat AS (
    SELECT * FROM swap_referrals
    UNION
    SELECT * FROM reverse_referrals
)
SELECT
    year,
    month,
    pair,
    id,
    sum(trades) AS trades,
    round(sum(volume), 8) AS volume,
    round(sum(referralSum), 8) AS referralSum
FROM dat
GROUP BY year, month, pair, id;

-- Failures

CREATE VIEW reverse_successes AS
SELECT coalesce(referral, 'none') AS referral, count(*) successful
FROM reverseSwaps
WHERE status = 'invoice.settled'
GROUP BY referral;

CREATE VIEW reverse_failures AS
SELECT coalesce(referral, 'none') AS referral, count(*) failed
FROM reverseSwaps
WHERE status = 'transaction.refunded'
GROUP BY referral;

SELECT
    rc.referral AS referral,
    rf.failed,
    rc.successful,
    round((rf.failed * 100) / cast((rc.successful + rf.failed) AS REAL), 4) AS failureRate
FROM reverse_successes rc
    INNER JOIN reverse_failures rf ON rc.referral = rf.referral
ORDER BY failureRate desc;

SELECT round((count(*) * 100) / cast((
    SELECT count(*)
    FROM swaps
    WHERE status = 'transaction.claimed'
) + count(*) AS REAL), 4) AS failureRate
FROM swaps
WHERE status = 'invoice.failedToPay';

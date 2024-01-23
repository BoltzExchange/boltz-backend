-- Views

CREATE OR REPLACE VIEW successfulSwaps AS (
    SELECT
        pair,
        status,
        referral,
        fee,
        CASE WHEN "orderSide" = 1
                THEN "invoiceAmount"
            ELSE "onchainAmount"
        END AS amount,
        "createdAt"
    FROM swaps
    WHERE pair IN ('BTC/BTC', 'L-BTC/BTC') AND
        status = 'transaction.claimed'
);

CREATE OR REPLACE VIEW successReverseSwaps AS (
    SELECT
        pair,
        status,
        referral,
        fee,
        CASE WHEN "orderSide" = 1
            THEN "onchainAmount"
            ELSE "invoiceAmount"
        END AS amount,
        "createdAt"
    FROM "reverseSwaps"
    WHERE pair IN ('BTC/BTC', 'L-BTC/BTC') AND
        status = 'invoice.settled'
);

-- Taproot

SELECT 'swaps' AS type, COUNT(*)
FROM swaps
WHERE version = 1
UNION
SELECT 'reverse' AS type, COUNT(*)
FROM "reverseSwaps"
WHERE version = 1;

--
-- Stats
--

-- Volume

WITH data AS (
    SELECT * FROM successfulSwaps
    UNION ALL
    SELECT * FROM successReverseSwaps
)
SELECT
    EXTRACT(YEAR FROM "createdAt") AS year,
    EXTRACT(MONTH FROM "createdAt") AS month,
    pair,
    SUM(amount) / POW(10, 8) AS sum
FROM data
GROUP BY GROUPING SETS (
    (),
    (year),
    (year, month),
    (year, month, pair)
)
ORDER BY
    year NULLS FIRST,
    month NULLS FIRST,
    pair NULLS FIRST;

-- Referrals

WITH data AS (
    SELECT pair, status, fee, referral, "createdAt" FROM successfulSwaps
    UNION ALL
    SELECT pair, status, fee, referral, "createdAt" FROM successReverseSwaps
)
SELECT
    EXTRACT(YEAR from data."createdAt") AS year,
    EXTRACT(MONTH from data."createdAt") AS month,
    pair,
    data.referral as referral,
    (SUM(data.fee * r."feeShare") / 100)::BIGINT AS sum
FROM data
    INNER JOIN referrals r ON data.referral = r.id
GROUP BY GROUPING SETS (
    (year, month, pair, data.referral),
    (year, month, data.referral)
)
ORDER BY year, month, pair NULLS FIRST, referral;

-- Volume shares

WITH successful AS (
	SELECT
	    pair,
	    EXTRACT(YEAR FROM "createdAt") AS year,
        EXTRACT(MONTH FROM "createdAt") AS month,
	    COUNT(*) AS count,
	    SUM(amount) / POW(10, 8) AS volume
	FROM (SELECT * FROM successfulSwaps UNION SELECT * FROM successReverseSwaps) as allSwaps
	GROUP BY pair, year, month
), total_counts AS (
    SELECT
        year,
        month,
        SUM(count) AS total_count
    FROM successful
    GROUP BY year, month
), total_volume AS (
    SELECT
        year,
        month,
        SUM(volume) AS total_volume
    FROM successful
    GROUP BY year, month
)
SELECT
	s.year AS year,
	s.month AS month,
	s.pair AS pair,
	SUM(count) AS count,
    SUM(count) * 100 / SUM(t.total_count) AS count_pct,
	SUM(volume) AS volume,
    SUM(volume) * 100 / SUM(v.total_volume) AS volume_pct
FROM successful s
    INNER JOIN total_counts t ON
        s.year = t.year AND
        s.month = t.month
    INNER JOIN total_volume v ON
        s.year = v.year AND
        s.month = v.month
GROUP BY GROUPING SETS (
    (s.year, s.month, pair)
)
ORDER BY year, month, pair NULLS FIRST;

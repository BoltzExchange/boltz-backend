-- Views

CREATE OR REPLACE VIEW successfulSwaps AS (
    SELECT
        id,
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
        id,
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

WITH allSwaps AS (
    SELECT 'swaps' AS type, pair, version, "createdAt"
    FROM swaps
    WHERE status = 'transaction.claimed'
    UNION
    SELECT 'reverse' AS type, pair, version, "createdAt"
    FROM "reverseSwaps"
    WHERE status = 'invoice.settled'
), postTaproot AS (
    SELECT
        EXTRACT(YEAR FROM "createdAt") AS year,
        EXTRACT(MONTH FROM "createdAt") AS month,
        EXTRACT(DAY FROM "createdAt") AS day,
        type,
        pair,
        version,
        COUNT(*) AS count
    FROM allSwaps
    WHERE "createdAt" >= (
        SELECT MIN("createdAt") FROM allSwaps WHERE version = 1
    )
    GROUP BY
        EXTRACT(YEAR FROM "createdAt"),
        EXTRACT(MONTH FROM "createdAt"),
        EXTRACT(DAY FROM "createdAt"),
        type,
        pair,
        version
)
SELECT
    year,
    month,
    day,
    type,
    pair,
    SUM(count) as count,
    SUM(CASE WHEN version = 1 THEN count ELSE 0 END) as count_taproot,
    100.0 * SUM(CASE WHEN version = 1 THEN count ELSE 0 END) /
        NULLIF(SUM(count), 0) as taproot_percentage
FROM postTaproot
GROUP BY GROUPING SETS (
    (year, month),
    (year, month, day),
    (year, month, day, type),
    (year, month, day, type, pair)
)
ORDER BY year, month, day NULLS FIRST, type NULLS FIRST, pair NULLS FIRST;

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
    COUNT(*) AS count,
    (SUM(data.fee * r."feeShare") / 100)::BIGINT AS sum
FROM data
    INNER JOIN referrals r ON data.referral = r.id
GROUP BY GROUPING SETS (
    (year, month, data.referral),
    (year, month, pair, data.referral)
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
)
SELECT
	year AS year,
	month AS month,
	pair AS pair,
	SUM(count) AS count,
    SUM(count) * 100 / SUM(SUM(count)) OVER (PARTITION BY year, month) AS count_pct,
	SUM(volume) AS volume,
    SUM(volume) * 100 / SUM(SUM(volume)) OVER (PARTITION BY year, month) AS volume_pct
FROM successful
GROUP BY year, month, pair
ORDER BY year, month, pair NULLS FIRST;

-- Marked swaps

WITH swaps AS (
    SELECT s.id AS id, fee, s."createdAt" AS "createdAt"
    FROM successfulSwaps s INNER JOIN "markedSwaps" m ON s.id = m.id
), reverseSwaps as (
    SELECT s.id AS id, fee, s."createdAt" AS "createdAt"
    FROM successReverseSwaps s INNER JOIN "markedSwaps" m ON s.id = m.id
), marked AS (
    SELECT *
    FROM swaps UNION ALL SELECT * FROM reverseSwaps
)
SELECT
    EXTRACT(YEAR FROM "createdAt") AS year,
    EXTRACT(MONTH FROM "createdAt") AS month,
    EXTRACT(DAY FROM "createdAt") AS day,
    SUM(fee) AS revenue
FROM marked
GROUP BY GROUPING SETS (
    (year, month, day),
    (year, month),
    (year)
)
ORDER BY year, month NULLS LAST, day NULLS LAST;

-- Upgrade date-only column to datetime (idempotent if already DATETIME)
ALTER TABLE todos MODIFY due_date DATETIME NULL;

-- Legacy DATE rows became midnight; set end-of-day for same-day semantics
UPDATE todos
SET due_date = TIMESTAMP(DATE(due_date), '23:59:59')
WHERE due_date IS NOT NULL
  AND TIME(due_date) = '00:00:00';

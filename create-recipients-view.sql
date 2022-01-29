-- Add here the SQL statement to create a view that filters the monthly subscribers
-- on the promotions mailing list, and sort them alphabetically

CREATE TABLE recipients AS SELECT email FROM newsletters WHERE promotions = 0 ORDER BY email ASC;
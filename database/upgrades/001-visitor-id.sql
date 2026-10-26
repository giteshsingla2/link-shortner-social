-- Adds unique-visitor tracking to a database created from an older database/schema.sql.
-- Run once:  mysql -h 127.0.0.1 -u USER -p DATABASE < database/upgrades/001-visitor-id.sql
-- (Running it twice fails with "Duplicate column name 'visitor_id'", which is harmless.)
ALTER TABLE `clicks`
  ADD COLUMN `visitor_id` varchar(16) DEFAULT NULL,
  DROP INDEX `clicks_link_time_idx`,
  ADD INDEX `clicks_link_time_idx` (`link_id`, `clicked_at`, `visitor_id`);

-- Adds what the admin panel needs: suspending users and disabling links.
-- Run once:  mysql -h 127.0.0.1 -u USER -p DATABASE < database/upgrades/002-admin.sql
-- (Running it twice fails with "Duplicate column name", which is harmless.)
ALTER TABLE `users` ADD COLUMN `suspended_at` datetime DEFAULT NULL;
ALTER TABLE `links` ADD COLUMN `disabled_at` datetime DEFAULT NULL;

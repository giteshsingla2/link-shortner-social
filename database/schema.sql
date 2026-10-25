-- Link shortener schema for MySQL 8 / MariaDB 10.5+
-- Import this file in phpMyAdmin (select your database > Import tab).
-- It matches drizzle/0000_init.sql; use one or the other, not both.

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `links` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `slug` varchar(64) NOT NULL,
  `url` varchar(2048) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `click_count` int unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `links_slug_unique` (`slug`),
  KEY `links_user_idx` (`user_id`, `created_at`),
  CONSTRAINT `links_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `clicks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `link_id` bigint unsigned NOT NULL,
  `clicked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `country` char(2) DEFAULT NULL,
  `platform` varchar(32) NOT NULL,
  `device` varchar(16) NOT NULL,
  `os` varchar(32) NOT NULL,
  `browser` varchar(32) NOT NULL,
  `referrer_host` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `clicks_link_time_idx` (`link_id`, `clicked_at`),
  CONSTRAINT `clicks_link_id_links_id_fk` FOREIGN KEY (`link_id`) REFERENCES `links` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

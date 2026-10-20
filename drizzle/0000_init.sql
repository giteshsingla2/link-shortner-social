CREATE TABLE `clicks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`link_id` bigint unsigned NOT NULL,
	`clicked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`country` char(2),
	`platform` varchar(32) NOT NULL,
	`device` varchar(16) NOT NULL,
	`os` varchar(32) NOT NULL,
	`browser` varchar(32) NOT NULL,
	`referrer_host` varchar(255),
	CONSTRAINT `clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`slug` varchar(64) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`title` varchar(255),
	`click_count` int unsigned NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `links_id` PRIMARY KEY(`id`),
	CONSTRAINT `links_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `clicks` ADD CONSTRAINT `clicks_link_id_links_id_fk` FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `links` ADD CONSTRAINT `links_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `clicks_link_time_idx` ON `clicks` (`link_id`,`clicked_at`);--> statement-breakpoint
CREATE INDEX `links_user_idx` ON `links` (`user_id`,`created_at`);
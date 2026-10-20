CREATE TABLE `click_daily` (
	`link_id` bigint unsigned NOT NULL,
	`day` date NOT NULL,
	`country` char(2) NOT NULL DEFAULT '',
	`platform` varchar(32) NOT NULL,
	`device` varchar(16) NOT NULL,
	`os` varchar(32) NOT NULL,
	`browser` varchar(32) NOT NULL,
	`referrer_host` varchar(255) NOT NULL DEFAULT '',
	`clicks` int unsigned NOT NULL,
	CONSTRAINT `click_daily_pk` PRIMARY KEY(`link_id`,`day`,`country`,`platform`,`device`,`os`,`browser`,`referrer_host`)
);
--> statement-breakpoint
ALTER TABLE `click_daily` ADD CONSTRAINT `click_daily_link_id_links_id_fk` FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON DELETE cascade ON UPDATE no action;
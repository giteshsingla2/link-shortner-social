-- One statement: the link_id foreign key needs an index at every moment, so the old index can't be dropped on its own first.
ALTER TABLE `clicks` ADD `visitor_id` varchar(16), DROP INDEX `clicks_link_time_idx`, ADD INDEX `clicks_link_time_idx` (`link_id`,`clicked_at`,`visitor_id`);

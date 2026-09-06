CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`intent` varchar(64),
	`structuredAction` text,
	`validationResult` text,
	`response` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`actor` varchar(32) NOT NULL DEFAULT 'user',
	`payloadSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastQualifiedDate` varchar(16),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `streaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `streaks_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL DEFAULT 'general',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`durationMinutes` int NOT NULL DEFAULT 30,
	`scheduledStart` timestamp,
	`deadline` timestamp,
	`recurrenceRule` varchar(128),
	`status` enum('planned','in_progress','completed','postponed','cancelled') NOT NULL DEFAULT 'planned',
	`xpReward` int NOT NULL DEFAULT 10,
	`source` enum('manual','ai') NOT NULL DEFAULT 'manual',
	`completionIdempotencyKey` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`availabilityWindows` text NOT NULL DEFAULT ('[]'),
	`dailyCapacityMinutes` int NOT NULL DEFAULT 120,
	`notificationPreferences` text NOT NULL DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `xp_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int,
	`amount` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`idempotencyKey` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xp_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `xp_idempotency_idx` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `totalXp` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `rank` varchar(4) DEFAULT 'E' NOT NULL;--> statement-breakpoint
CREATE INDEX `ai_user_created_idx` ON `ai_conversations` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_user_created_idx` ON `audit_events` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tasks_user_schedule_idx` ON `tasks` (`userId`,`scheduledStart`);--> statement-breakpoint
CREATE INDEX `tasks_user_status_idx` ON `tasks` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `tasks_user_deadline_idx` ON `tasks` (`userId`,`deadline`);--> statement-breakpoint
CREATE INDEX `xp_user_created_idx` ON `xp_transactions` (`userId`,`createdAt`);
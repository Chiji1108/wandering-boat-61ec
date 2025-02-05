import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	age: int('age').notNull(),
	email: text('email').notNull().unique(),
});

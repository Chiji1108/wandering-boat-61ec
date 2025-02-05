/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { drizzle } from 'drizzle-orm/d1';
import { usersTable } from './schema';
import { Hono } from 'hono';
import { apiReference } from '@scalar/hono-api-reference';
import { describeRoute, openAPISpecs } from 'hono-openapi';
import { resolver } from 'hono-openapi/typebox';
import { createSelectSchema } from 'drizzle-typebox';
import { Type } from '@sinclair/typebox';

const app = new Hono<{ Bindings: Env }>();

const usersSchema = createSelectSchema(usersTable, {
	id: (schema) => Type.String({ ...schema, format: 'uuid' }),
	name: (schema) => Type.String({ ...schema, minLength: 1 }),
	age: (schema) => Type.Integer({ ...schema, minimum: 0 }),
	email: (schema) => Type.String({ ...schema, format: 'email' }),
});

app.get(
	'/openapi',
	openAPISpecs(app, {
		documentation: {
			info: { title: 'Hono API', version: '1.0.0' },
			servers: [{ url: 'http://localhost:8787', description: 'Local' }],
		},
	})
);
app.get(
	'/docs',
	apiReference({
		theme: 'saturn',
		spec: { url: '/openapi' },
	})
);
app.get(
	'/users',
	describeRoute({
		summary: 'Get all users',
		responses: {
			200: {
				description: 'Users fetched successfully',
				content: {
					'application/json': {
						schema: resolver(usersSchema),
					},
				},
			},
		},
		validateResponse: true,
	}),
	async (c) => {
		const db = drizzle(c.env.DB);
		const users = await db.select().from(usersTable);
		return c.json(users);
	}
);

export default app;

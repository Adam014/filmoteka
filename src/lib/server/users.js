import { isListedUser, toPublicUser } from '../user.js';
import { cached } from './cache.js';
import { adminDb } from './supabase.js';

const PER_PAGE = 200;

/** Every auth user, across all pages. Server only: these records contain e-mail addresses. */
export async function listAuthUsers() {
	const admin = adminDb();
	if (!admin) return null;

	return cached('auth-users', 60 * 1000, async () => {
		const users = [];
		for (let page = 1; ; page++) {
			const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
			if (error) {
				console.error('Listing users failed:', error.message);
				return null;
			}
			users.push(...data.users);
			if (data.users.length < PER_PAGE) return users;
		}
	});
}

/** Names and avatars of registered people, safe to send to any visitor. */
export async function listPublicUsers() {
	const users = await listAuthUsers();
	return (users ?? []).filter(isListedUser).map(toPublicUser);
}

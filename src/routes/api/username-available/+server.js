import { displayName } from '#lib/user.js';
import { listAuthUsers } from '#lib/server/users.js';

export async function GET({ url }) {
	const name = (url.searchParams.get('name') ?? '').trim().toLowerCase();
	if (!name) return Response.json({ available: false });

	const users = await listAuthUsers();
	// Without the user list the sign-up should still work, so availability is assumed.
	if (!users) return Response.json({ available: true });

	const taken = users.some((user) => displayName(user).toLowerCase() === name);
	return Response.json({ available: !taken });
}

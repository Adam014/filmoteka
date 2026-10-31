import { readFavorites } from '#lib/server/favorites.js';
import { adminDb } from '#lib/server/supabase.js';
import { listAuthUsers } from '#lib/server/users.js';
import { displayName, toPublicUser } from '#lib/user.js';

const fail = (status, message) => Response.json({ message }, { status });

/** Profiles are for signed-in people, so the session token is verified before anything is read. */
export async function GET({ params, request }) {
	const admin = adminDb();
	if (!admin) return fail(503, 'Profiles are unavailable right now.');

	const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
	if (!token) return fail(401, 'Log in to view profiles.');
	const { data: session, error: authError } = await admin.auth.getUser(token);
	if (authError || !session?.user) return fail(401, 'Log in to view profiles.');

	const users = await listAuthUsers();
	if (!users) return fail(503, 'Profiles are unavailable right now.');

	const owner = users.find((user) => displayName(user) === params.name);
	if (!owner) return fail(404, 'No one goes by that name.');

	const [followers, following, favorites] = await Promise.all([
		admin.from('follows').select('follower_id').eq('followed_id', owner.id),
		admin.from('follows').select('followed_id').eq('follower_id', owner.id),
		readFavorites(owner.email)
	]);
	if (followers.error || following.error) return fail(503, 'Profiles are unavailable right now.');

	const pick = (ids) =>
		users.filter((user) => ids.has(user.id) && displayName(user)).map(toPublicUser);

	return Response.json(
		{
			profile: toPublicUser(owner),
			followers: pick(new Set(followers.data.map((row) => row.follower_id))),
			following: pick(new Set(following.data.map((row) => row.followed_id))),
			favorites
		},
		{ headers: { 'cache-control': 'private, no-store' } }
	);
}

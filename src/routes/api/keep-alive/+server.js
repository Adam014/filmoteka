import { cronSecret } from '#lib/server/env.js';
import { db } from '#lib/server/supabase.js';

export async function GET({ request }) {
	const secret = cronSecret();
	if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 });
	}

	const client = db();
	if (!client) return Response.json({ message: 'Supabase is not configured' }, { status: 503 });

	const { error } = await client.from('films').select('id').limit(1);
	if (error) {
		console.error('Keep-alive ping failed:', error.message);
		return Response.json({ message: 'Ping failed' }, { status: 500 });
	}
	return Response.json({ message: 'Database pinged' });
}

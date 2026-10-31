import { safeQuery } from '#lib/server/catalog.js';

export async function load() {
	const rows = await safeQuery((client) =>
		client.from('daily_challenge').select('day').order('day', { ascending: false })
	);
	return { days: rows?.map((row) => row.day) ?? null };
}

import { parseDay } from '#lib/game.js';
import { db } from '#lib/server/supabase.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const day = parseDay(params.day);
	if (!day) error(404, "There's no challenge at this address.");

	const client = db();
	if (!client) error(503, 'The game is unavailable right now.');

	const challenge = await client.from('daily_challenge').select('*').eq('day', day).maybeSingle();

	// 22003: the number doesn't fit the column, so no such day can exist.
	if (challenge.error?.code === '22003') error(404, `There's no challenge for day ${day}.`);
	if (challenge.error) error(503, 'The game is unavailable right now.');
	if (!challenge.data) error(404, `There's no challenge for day ${day}.`);

	return { day, challenge: challenge.data };
}
